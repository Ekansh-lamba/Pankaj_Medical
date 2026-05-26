const Order = require('../models/Order');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const razorpayService = require('../services/razorpay.service');

// Helper to log audit actions
const logAudit = async (req, action, model, targetId, prev, nextVal) => {
  try {
    await AuditLog.create({
      performedBy: req.user?._id || null,
      role: req.user?.role || 'system',
      action,
      targetModel: model,
      targetId,
      previousValue: prev,
      newValue: nextVal,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging failed in Payment Controller:', err);
  }
};

// Helper to trigger customer in-app notification
const createNotification = async (recipientId, type, title, message, link) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      link
    });
  } catch (err) {
    console.error('Notification creation failed in Payment Controller:', err);
  }
};

// Helper to rollback stock levels on cancellation/refund/failure
async function rollbackStock(items) {
  for (const item of items) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
  }
}

/**
 * POST /api/payments/create-order
 * Body: { orderId }
 */
exports.createOrder = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify ownership
    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized access to this order.' });
    }

    if (order.payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This order has already been paid.' });
    }

    // Create Razorpay Order
    const razorpayOrder = await razorpayService.createRazorpayOrder(
      order.grandTotal,
      order._id.toString()
    );

    order.payment.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order: razorpayOrder
    });
  } catch (error) {
    console.error('Payment: Create Razorpay order failed:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Payment initiation failed.' });
  }
};

/**
 * POST /api/payments/verify
 * Body: { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature }
 */
exports.verify = async (req, res) => {
  const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing payment signature verification parameters.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const previousStatus = order.status;
    const isVerified = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (isVerified) {
      order.payment.status = 'paid';
      order.payment.razorpayPaymentId = razorpay_payment_id;
      order.payment.paidAt = new Date();

      // Check if prescription verification is needed
      const hasRxItems = order.items.some((i) => i.rxType === 'H' || i.rxType === 'NRX');
      const nextStatus = hasRxItems ? 'pending_approval' : 'confirmed';

      order.status = nextStatus;
      order.timeline.push({
        status: nextStatus,
        updatedBy: req.user._id
      });

      await order.save();

      // Trigger invoice generation immediately if online order is confirmed directly
      if (nextStatus === 'confirmed') {
        try {
          const invoiceService = require('../services/invoice.service');
          Order.findById(order._id)
            .populate('customer')
            .then((populatedOrder) => {
              if (populatedOrder) {
                invoiceService
                  .generateAndUploadInvoice(populatedOrder)
                  .then(async (url) => {
                    order.invoiceUrl = url;
                    await order.save();
                    console.log(
                      `[Invoice] Automatically created invoice for online order ${order.orderNumber}`
                    );
                  })
                  .catch((err) =>
                    console.error('Invoice auto-creation failed for online order:', err)
                  );
              }
            });
        } catch (invoiceErr) {
          console.error('Invoice auto-creation bootstrap failed on verify:', invoiceErr);
        }
      }

      // Send confirmation email
      try {
        const emailService = require('../services/email.service');
        await emailService.sendOrderConfirmed(req.user.email, req.user.name, order);
      } catch (emailErr) {
        console.error('Email dispatch failed on payment verification:', emailErr);
      }

      // Customer notifications
      await createNotification(
        order.customer,
        'order_placed',
        'Payment Successful & Order Placed',
        `Your payment of ₹${order.grandTotal.toFixed(2)} was verified. Order ${order.orderNumber} is now ${nextStatus.toUpperCase().replace('_', ' ')}.`,
        `/my-orders/${order._id}`
      );

      // Staff warnings for prescription items
      if (hasRxItems) {
        const staffUsers = await User.find({ role: { $in: ['staff', 'admin'] } });
        for (const u of staffUsers) {
          await createNotification(
            u._id,
            'new_rx_order',
            'Prescription Verification Required',
            `Order ${order.orderNumber} requires RX review.`,
            '/staff/prescriptions'
          );
        }
      }

      await logAudit(req, 'PAYMENT_VERIFIED', 'Order', order._id, previousStatus, nextStatus);

      return res.status(200).json({
        success: true,
        message: 'Payment verified and order confirmed.',
        data: order
      });
    } else {
      order.status = 'payment_failed';
      order.payment.status = 'failed';
      order.timeline.push({
        status: 'payment_failed',
        updatedBy: req.user._id
      });
      await order.save();

      // Auto stock rollback
      await rollbackStock(order.items);

      await logAudit(
        req,
        'PAYMENT_VERIFICATION_FAILED',
        'Order',
        order._id,
        previousStatus,
        'payment_failed'
      );

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.'
      });
    }
  } catch (error) {
    console.error('Payment verification exception:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Payment verification failed.' });
  }
};

/**
 * POST /api/payments/retry/:orderId
 */
exports.retryPayment = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid.' });
    }

    // Re-verify stock and lock it again if the order was set to payment_failed and released
    if (order.status === 'payment_failed' || order.payment.status === 'failed') {
      // Re-acquire stock lock
      const reserved = [];
      for (const item of order.items) {
        const updateResult = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
        if (updateResult.modifiedCount === 0) {
          // Release what we locked
          await rollbackStock(reserved);
          return res.status(400).json({
            success: false,
            message: `Cannot retry payment: Insufficient stock for ${item.name}.`
          });
        }
        reserved.push({ product: item.product, quantity: item.quantity });
      }

      // Re-establish stock release scheduler (30-minute lock)
      setTimeout(
        async () => {
          try {
            const freshOrder = await Order.findById(order._id);
            if (freshOrder && freshOrder.status === 'pending_payment') {
              freshOrder.status = 'payment_failed';
              freshOrder.payment.status = 'failed';
              freshOrder.timeline.push({ status: 'payment_failed', updatedBy: null });
              await freshOrder.save();
              await rollbackStock(order.items);
            }
          } catch (e) {
            console.error('Stock release timeout failed on retry:', e);
          }
        },
        30 * 60 * 1000
      );
    }

    // Generate a fresh Razorpay Order
    const razorpayOrder = await razorpayService.createRazorpayOrder(
      order.grandTotal,
      order._id.toString()
    );

    order.payment.razorpayOrderId = razorpayOrder.id;
    order.payment.status = 'pending';
    order.status = 'pending_payment';
    order.timeline.push({
      status: 'pending_payment',
      updatedBy: req.user._id
    });
    await order.save();

    return res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order: razorpayOrder
    });
  } catch (error) {
    console.error('Payment: Retry order failed:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Retry payment failed.' });
  }
};

/**
 * POST /api/payments/refund/:orderId
 * Body: { password, refundAmount }
 */
exports.refundOrder = async (req, res) => {
  const { orderId } = req.params;
  const { password, refundAmount } = req.body;

  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: 'Admin confirmation password is required.' });
  }

  try {
    // 1. Password verification
    const admin = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication failed. Password incorrect.' });
    }

    // 2. Fetch order
    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.payment.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot refund an unpaid order.' });
    }

    const amtToRefund = refundAmount || order.grandTotal;

    // 3. Trigger refund
    await razorpayService.initiateRefund(order.payment.razorpayPaymentId, amtToRefund);

    const prevStatus = order.status;

    order.payment.status = 'refunded';
    order.payment.refundAmount = amtToRefund;
    order.payment.refundedAt = new Date();

    // Soft cancel order if not already cancelled
    if (order.status !== 'cancelled') {
      order.status = 'cancelled';
      order.cancellationReason = 'Refunded by administrator';
      order.timeline.push({
        status: 'cancelled',
        updatedBy: req.user._id
      });
      // Rollback stock levels
      await rollbackStock(order.items);
    }

    await order.save();

    // Send refund email
    try {
      const emailService = require('../services/email.service');
      await emailService.sendRefundProcessed(order.customer.email, order.customer.name, order);
    } catch (emailErr) {
      console.error('Email dispatch failed on refund:', emailErr);
    }

    await createNotification(
      order.customer,
      'refund_initiated',
      'Refund Processed Successfully',
      `A refund of ₹${amtToRefund.toFixed(2)} was successfully processed for your order ${order.orderNumber}.`,
      `/my-orders/${order._id}`
    );

    await logAudit(req, 'REFUND_ORDER', 'Order', order._id, prevStatus, 'cancelled');

    return res.status(200).json({
      success: true,
      message: `Refund of ₹${amtToRefund.toFixed(2)} initiated successfully.`,
      data: order
    });
  } catch (error) {
    console.error('Refund order error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Refund request failed.' });
  }
};

/**
 * POST /api/payments/webhook
 */
exports.webhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res
      .status(400)
      .json({ success: false, message: 'Signature or Secret configuration missing.' });
  }

  try {
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    console.log(`Razorpay Webhook: Received event - ${event}`);

    // Processes standard capturing webhooks
    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId }).populate(
        'customer'
      );
      if (order && order.payment.status !== 'paid') {
        const previousStatus = order.status;
        order.payment.status = 'paid';
        order.payment.razorpayPaymentId = paymentId;
        order.payment.paidAt = new Date();

        const hasRxItems = order.items.some((i) => i.rxType === 'H' || i.rxType === 'NRX');
        const nextStatus = hasRxItems ? 'pending_approval' : 'confirmed';

        order.status = nextStatus;
        order.timeline.push({ status: nextStatus, updatedBy: null });
        await order.save();

        // Trigger invoice generation immediately on webhook capture
        if (nextStatus === 'confirmed') {
          try {
            const invoiceService = require('../services/invoice.service');
            invoiceService
              .generateAndUploadInvoice(order)
              .then(async (url) => {
                order.invoiceUrl = url;
                await order.save();
                console.log(
                  `[Invoice] Automatically created invoice for webhook order ${order.orderNumber}`
                );
              })
              .catch((err) =>
                console.error('Invoice auto-creation failed for webhook order:', err)
              );
          } catch (invoiceErr) {
            console.error('Invoice auto-creation bootstrap failed on webhook capture:', invoiceErr);
          }
        }

        // Send confirmation email via webhook
        try {
          const emailService = require('../services/email.service');
          await emailService.sendOrderConfirmed(order.customer.email, order.customer.name, order);
        } catch (emailErr) {
          console.error('Email dispatch failed on webhook capture:', emailErr);
        }

        await createNotification(
          order.customer,
          'order_placed',
          'Online Payment Received',
          `Your online payment was captured. Order ${order.orderNumber} is now ${nextStatus.toUpperCase().replace('_', ' ')}.`,
          `/my-orders/${order._id}`
        );

        await logAudit(
          { user: { _id: null, role: 'system' }, ip: '127.0.0.1', headers: {} },
          'WEBHOOK_PAYMENT_CAPTURED',
          'Order',
          order._id,
          previousStatus,
          nextStatus
        );
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = req.body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;

      const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId });
      if (order && order.payment.status === 'pending') {
        const previousStatus = order.status;
        order.status = 'payment_failed';
        order.payment.status = 'failed';
        order.timeline.push({ status: 'payment_failed', updatedBy: null });
        await order.save();

        // Release stock
        await rollbackStock(order.items);

        await createNotification(
          order.customer,
          'order_cancelled',
          'Payment Attempt Failed',
          `Your payment attempt for order ${order.orderNumber} failed. You can retry from your order dashboard.`,
          `/my-orders/${order._id}`
        );

        await logAudit(
          { user: { _id: null, role: 'system' }, ip: '127.0.0.1', headers: {} },
          'WEBHOOK_PAYMENT_FAILED',
          'Order',
          order._id,
          previousStatus,
          'payment_failed'
        );
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook event processed.' });
  } catch (error) {
    console.error('Webhook processing exception:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed.' });
  }
};
