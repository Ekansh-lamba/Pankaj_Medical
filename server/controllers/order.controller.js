const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Cart = require('../models/Cart');

// Status transition locking rules
const LEGAL_TRANSITIONS = {
  pending_payment: ['payment_failed', 'pending_approval', 'confirmed', 'cancelled'],
  payment_failed: [],
  pending_approval: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped'], // Customer cannot cancel after packed
  shipped: ['delivered'],
  delivered: ['return_requested'],
  cancelled: [],
  return_requested: ['return_approved', 'return_rejected'],
  return_approved: [],
  return_rejected: []
};

// Helper to log audit actions
const logAudit = async (req, action, model, targetId, prev, nextVal) => {
  try {
    await AuditLog.create({
      performedBy: req.user._id,
      role: req.user.role,
      action,
      targetModel: model,
      targetId,
      previousValue: prev,
      newValue: nextVal,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
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
    console.error('Notification creation failed:', err);
  }
};

// POST /api/orders — place order
exports.placeOrder = async (req, res) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before placing orders.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  const { deliveryType, deliveryAddress, items, paymentMethod, couponCode } = req.body;

  if (!deliveryType || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing required order fields' });
  }

  try {
    const settings = (await Settings.findOne()) || {
      deliveryCharge: 50,
      freeDeliveryThreshold: 500,
      minimumOrderValue: 200,
      serviceablePinCodes: []
    };

    // 1. Serviceable pin codes check
    if (deliveryType === 'delivery') {
      if (!deliveryAddress || !deliveryAddress.pinCode) {
        return res
          .status(400)
          .json({ success: false, message: 'Delivery address and pin code are required' });
      }
      if (!settings.serviceablePinCodes.includes(deliveryAddress.pinCode)) {
        return res.status(400).json({
          success: false,
          message: 'Delivery is not serviceable at this pin code',
          code: 'PIN_NOT_SERVICEABLE'
        });
      }
    }

    // 2. Load and validate stock/status of all items
    const reservedItems = [];
    let subtotal = 0;
    let gstTotal = 0;
    let hasRxItems = false;

    for (const orderItem of items) {
      const product = await Product.findById(orderItem.product);
      if (!product || !product.isActive || product.isHidden) {
        // Rollback reserved items if any
        await rollbackStock(reservedItems);
        return res.status(400).json({
          success: false,
          message: `Medicine "${orderItem.name || 'Unknown'}" is not available`
        });
      }

      const requestedQty = parseInt(orderItem.quantity, 10);
      if (isNaN(requestedQty) || requestedQty < 1) {
        await rollbackStock(reservedItems);
        return res.status(400).json({ success: false, message: 'Invalid item quantity' });
      }

      // Check max allowed limits
      const isRx = product.rxType === 'H' || product.rxType === 'NRX';
      const maxLimit = isRx ? 2 : 10;
      if (requestedQty > maxLimit) {
        await rollbackStock(reservedItems);
        return res.status(400).json({
          success: false,
          message: `Exceeded maximum units of ${maxLimit} for ${product.name}`
        });
      }

      // Atomic stock decrement verification
      const updateResult = await Product.updateOne(
        { _id: product._id, stock: { $gte: requestedQty } },
        { $inc: { stock: -requestedQty } }
      );

      if (updateResult.modifiedCount === 0) {
        await rollbackStock(reservedItems);
        return res
          .status(400)
          .json({ success: false, message: `Insufficient stock for medicine: ${product.name}` });
      }

      // Track reserved item for rollback safety
      reservedItems.push({ productId: product._id, quantity: requestedQty });

      const itemTotal = product.sellingPrice * requestedQty;
      subtotal += itemTotal;

      // GST exclusive calculations (MRP is inclusive of GST)
      const gstRate = product.gstRate || 12;
      const gstAmount = itemTotal * (gstRate / (100 + gstRate));
      gstTotal += gstAmount;

      if (product.rxType === 'H' || product.rxType === 'NRX') {
        hasRxItems = true;
      }
    }

    // 3. Minimum order value validation
    if (deliveryType === 'delivery' && subtotal < settings.minimumOrderValue) {
      await rollbackStock(reservedItems);
      return res.status(400).json({
        success: false,
        message: `Minimum order value for delivery is ₹${settings.minimumOrderValue}. Current order is ₹${subtotal}.`
      });
    }

    // 4. Calculate Auto-Offers
    let autoOfferDiscount = 0;
    if (settings.autoOffers && settings.autoOffers.length > 0) {
      const activeOffers = settings.autoOffers.filter(
        (o) => o.isActive && subtotal >= o.minOrderValue
      );
      let bestDiscount = 0;

      for (const offer of activeOffers) {
        let disc = 0;
        if (offer.discountType === 'percentage') {
          disc = subtotal * (offer.discountValue / 100);
          if (offer.maxDiscount && disc > offer.maxDiscount) {
            disc = offer.maxDiscount;
          }
        } else if (offer.discountType === 'flat') {
          disc = Math.min(offer.discountValue, subtotal);
        }

        if (disc > bestDiscount) {
          bestDiscount = disc;
        }
      }
      autoOfferDiscount = bestDiscount;
    }

    // 5. Calculate Coupon Discounts
    let couponDiscount = 0;
    let freeDeliveryCoupon = false;
    let couponDoc = null;

    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!couponDoc) {
        await rollbackStock(reservedItems);
        return res.status(400).json({ success: false, message: 'Invalid coupon code.' });
      }
      if (!couponDoc.isActive) {
        await rollbackStock(reservedItems);
        return res.status(400).json({ success: false, message: 'This coupon is inactive.' });
      }
      if (couponDoc.expiryDate && new Date(couponDoc.expiryDate) < new Date()) {
        await rollbackStock(reservedItems);
        return res.status(400).json({ success: false, message: 'This coupon has expired.' });
      }
      if (couponDoc.totalUsageLimit && couponDoc.usedCount >= couponDoc.totalUsageLimit) {
        await rollbackStock(reservedItems);
        return res
          .status(400)
          .json({ success: false, message: 'This coupon has reached its usage limit.' });
      }
      const userUsageCount = couponDoc.usedBy.filter(
        (id) => id.toString() === req.user._id.toString()
      ).length;
      if (userUsageCount >= couponDoc.perCustomerLimit) {
        await rollbackStock(reservedItems);
        return res
          .status(400)
          .json({ success: false, message: 'You have already used this coupon code.' });
      }
      if (subtotal < couponDoc.minOrderValue) {
        await rollbackStock(reservedItems);
        return res
          .status(400)
          .json({
            success: false,
            message: `Minimum order for coupon is ₹${couponDoc.minOrderValue}.`
          });
      }

      if (couponDoc.type === 'percentage') {
        couponDiscount = subtotal * (couponDoc.value / 100);
        if (couponDoc.maxDiscount && couponDiscount > couponDoc.maxDiscount) {
          couponDiscount = couponDoc.maxDiscount;
        }
      } else if (couponDoc.type === 'flat') {
        couponDiscount = Math.min(couponDoc.value, subtotal);
      } else if (couponDoc.type === 'free_delivery') {
        freeDeliveryCoupon = true;
      }
    }

    // Combine discounts (make sure we don't discount more than the subtotal)
    let totalDiscount = autoOfferDiscount + couponDiscount;
    if (totalDiscount > subtotal) {
      totalDiscount = subtotal;
    }

    // 6. Grand Total & Delivery Fees Calculations
    let deliveryCharge = subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryCharge;
    if (freeDeliveryCoupon) {
      deliveryCharge = 0;
    }
    const grandTotal = subtotal - totalDiscount + deliveryCharge;

    // Build items snapshots
    const orderItemsSnapshots = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      orderItemsSnapshots.push({
        product: product._id,
        name: product.name,
        brand: product.brand,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        quantity: item.quantity,
        rxType: product.rxType,
        gstRate: product.gstRate || 12,
        hsnCode: product.hsnCode,
        image: product.image
      });
    }

    // 5. Determine initial status based on payment and Rx classification
    let status = 'pending_payment';
    let paymentStatus = 'pending';

    if (paymentMethod === 'cod') {
      paymentStatus = 'pending';
      status = hasRxItems ? 'pending_approval' : 'confirmed';
    }

    // Create Order document
    const order = new Order({
      customer: req.user._id,
      items: orderItemsSnapshots,
      status,
      deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
      deliveryCharge,
      subtotal,
      discount: totalDiscount,
      couponCode: couponCode ? couponCode.toUpperCase() : undefined,
      couponDiscount,
      gstTotal,
      grandTotal,
      payment: {
        method: paymentMethod,
        status: paymentStatus
      },
      timeline: [
        {
          status,
          updatedBy: req.user._id
        }
      ]
    });

    await order.save();

    // Increment coupon usage if used
    if (couponDoc) {
      couponDoc.usedCount += 1;
      couponDoc.usedBy.push(req.user._id);
      await couponDoc.save();
    }

    // Trigger invoice generation immediately if COD order is confirmed directly
    if (status === 'confirmed') {
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
                    `[Invoice] Automatically created invoice for COD order ${order.orderNumber}`
                  );
                })
                .catch((err) => console.error('Invoice auto-creation failed for COD order:', err));
            }
          });
      } catch (invoiceErr) {
        console.error('Invoice auto-creation bootstrap failed:', invoiceErr);
      }
    }

    // Send confirmation email for COD orders immediately
    if (paymentMethod === 'cod') {
      try {
        const emailService = require('../services/email.service');
        await emailService.sendOrderConfirmed(req.user.email, req.user.name, order);
      } catch (emailErr) {
        console.error('Email dispatch failed on place COD order:', emailErr);
      }
    }

    // 6. Clear user cart since checkout is successful
    const userCart = await Cart.findOne({ customer: req.user._id });
    if (userCart) {
      userCart.items = [];
      await userCart.save();
    }

    // 7. Auto stock release scheduler for Razorpay pending payments (30-minute lock)
    if (paymentMethod === 'razorpay') {
      setTimeout(
        async () => {
          try {
            const freshOrder = await Order.findById(order._id);
            if (freshOrder && freshOrder.status === 'pending_payment') {
              freshOrder.status = 'payment_failed';
              freshOrder.payment.status = 'failed';
              freshOrder.timeline.push({ status: 'payment_failed', updatedBy: null });
              await freshOrder.save();
              await rollbackStock(
                orderItemsSnapshots.map((i) => ({ productId: i.product, quantity: i.quantity }))
              );
              console.log(
                `Auto-released stock locks for failed payment order PM: ${freshOrder.orderNumber}`
              );
            }
          } catch (e) {
            console.error('Stock release timeout failed:', e);
          }
        },
        30 * 60 * 1000
      );
    }

    // Create placement notifications
    await createNotification(
      req.user._id,
      'order_placed',
      'Order Placed Successfully',
      `Your order ${order.orderNumber} has been placed. Method: ${paymentMethod.toUpperCase()}.`,
      `/my-orders/${order._id}`
    );

    // If RX order, create staff alert notification
    if (hasRxItems && paymentMethod === 'cod') {
      // Find a staff or admin user to flag new prescription alerts
      const users = await mongoose.model('User').find({ role: { $in: ['staff', 'admin'] } });
      for (const u of users) {
        await createNotification(
          u._id,
          'new_rx_order',
          'New Prescription Verification Required',
          `Order ${order.orderNumber} contains H/NRX medicines and requires prescription review.`,
          '/staff/prescriptions'
        );
      }
    }

    await logAudit(req, 'PLACE_ORDER', 'Order', order._id, null, order);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (err) {
    console.error('Place order error:', err);
    return res
      .status(500)
      .json({ success: false, message: err.message || 'Server error while placing order' });
  }
};

// Stock helper rolling back stock levels on placement validation drops
async function rollbackStock(reservedItems) {
  for (const item of reservedItems) {
    await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
  }
}

// GET /api/orders/my-orders — Customer history (paginated)
exports.getMyOrders = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    const total = await Order.countDocuments({ customer: req.user._id });
    const orders = await Order.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('Get my orders error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching history' });
  }
};

// GET /api/orders/my-orders/:id — Customer detail
exports.getMyOrderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id }).populate(
      'prescriptions'
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error('Get order detail error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/orders/my-orders/:id/cancel — Customer cancel before packed
exports.cancelOrder = async (req, res) => {
  const { reason } = req.body;

  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Rules check: only pending_payment, pending_approval, or confirmed can cancel.
    const cancellableStatuses = ['pending_payment', 'pending_approval', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled at this stage (Current Status: ${order.status.toUpperCase()})`
      });
    }

    const previousStatus = order.status;
    order.status = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by customer';
    order.timeline.push({
      status: 'cancelled',
      updatedBy: req.user._id
    });

    if (order.payment.status === 'paid') {
      order.payment.status = 'refunded';
      order.payment.refundAmount = order.grandTotal;
      order.payment.refundedAt = new Date();
    }

    await order.save();

    // Atomic restoration of reserved stock
    await rollbackStock(
      order.items.map((item) => ({ productId: item.product, quantity: item.quantity }))
    );

    await createNotification(
      req.user._id,
      'order_cancelled',
      'Order Cancelled',
      `Your order ${order.orderNumber} was cancelled successfully.`,
      `/my-orders/${order._id}`
    );

    await logAudit(req, 'CANCEL_ORDER', 'Order', order._id, previousStatus, 'cancelled');

    return res
      .status(200)
      .json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (err) {
    console.error('Cancel order error:', err);
    return res.status(500).json({ success: false, message: 'Server error while cancelling order' });
  }
};

// POST /api/orders/my-orders/:id/rate — Customer submit rating
exports.rateOrder = async (req, res) => {
  const { score, comment } = req.body;

  if (!score || score < 1 || score > 5) {
    return res.status(400).json({ success: false, message: 'Invalid star score (must be 1-5)' });
  }

  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res
        .status(400)
        .json({ success: false, message: 'You can only rate delivered orders' });
    }

    order.rating = {
      score,
      comment,
      ratedAt: new Date()
    };

    await order.save();
    return res
      .status(200)
      .json({ success: true, message: 'Thank you for your rating!', data: order });
  } catch (err) {
    console.error('Rate order error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/orders/my-orders/:id/return — Raise return request
exports.requestReturn = async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Return reason is required' });
  }

  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res
        .status(400)
        .json({ success: false, message: 'Return can only be raised for delivered orders' });
    }

    const previousStatus = order.status;
    order.status = 'return_requested';
    order.returnReason = reason;
    order.timeline.push({
      status: 'return_requested',
      updatedBy: req.user._id
    });

    await order.save();

    // Inform admin
    const admins = await mongoose.model('User').find({ role: 'admin' });
    for (const u of admins) {
      await createNotification(
        u._id,
        'return_received',
        'New Return Request Raised',
        `Return request raised for order ${order.orderNumber} by customer.`,
        '/staff/orders'
      );
    }

    await logAudit(req, 'REQUEST_RETURN', 'Order', order._id, previousStatus, 'return_requested');

    return res
      .status(200)
      .json({ success: true, message: 'Return request raised successfully', data: order });
  } catch (err) {
    console.error('Request return error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Server error while initiating return' });
  }
};

// GET /api/orders — Staff order queue
exports.getAllOrders = async (req, res) => {
  const { status, hasRx, q } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }
  if (hasRx === 'true') {
    filter['items.rxType'] = { $in: ['H', 'NRX'] };
  }

  try {
    let orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('customer', 'name email phone');

    // If search text is provided
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      orders = orders.filter(
        (o) =>
          o.orderNumber.match(searchRegex) ||
          o.customer?.name?.match(searchRegex) ||
          o.customer?.email?.match(searchRegex)
      );
    }

    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    console.error('Get all orders error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/orders/:id/status — Staff updates status
exports.updateOrderStatus = async (req, res) => {
  const { status, staffNotes } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'New status is required' });
  }

  try {
    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    const allowed = LEGAL_TRANSITIONS[previousStatus] || [];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Illegal transition: Cannot update status from ${previousStatus.toUpperCase()} to ${status.toUpperCase()}`
      });
    }

    order.status = status;
    if (staffNotes) {
      order.staffNotes = staffNotes;
    }

    order.timeline.push({
      status,
      updatedBy: req.user._id
    });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      if (order.payment.method === 'cod') {
        order.payment.status = 'paid';
        order.payment.paidAt = new Date();
      }
    }

    await order.save();

    // Trigger invoice generation immediately if staff confirms a pending order
    if (status === 'confirmed') {
      try {
        const invoiceService = require('../services/invoice.service');
        invoiceService
          .generateAndUploadInvoice(order)
          .then(async (url) => {
            order.invoiceUrl = url;
            await order.save();
            console.log(
              `[Invoice] Automatically created invoice for confirmed order ${order.orderNumber}`
            );
          })
          .catch((err) => console.error('Invoice auto-creation failed for confirmed order:', err));
      } catch (invoiceErr) {
        console.error('Invoice auto-creation bootstrap failed on status update:', invoiceErr);
      }
    }

    // Send shipped email
    if (status === 'shipped') {
      try {
        const emailService = require('../services/email.service');
        await emailService.sendOrderShipped(order.customer.email, order.customer.name, order);
      } catch (emailErr) {
        console.error('Email dispatch failed on order shipped status update:', emailErr);
      }
    }

    // Customer notification
    await createNotification(
      order.customer,
      `order_${status}`,
      'Order Status Update',
      `Your order ${order.orderNumber} status has changed to ${status.toUpperCase().replace('_', ' ')}.`,
      `/my-orders/${order._id}`
    );

    await logAudit(req, 'UPDATE_STATUS', 'Order', order._id, previousStatus, status);

    return res
      .status(200)
      .json({ success: true, message: 'Status updated successfully', data: order });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ success: false, message: 'Server error while modifying status' });
  }
};

// PUT /api/orders/:id/cod-collected — Mark COD collected
exports.markCodCollected = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.payment.method !== 'cod') {
      return res
        .status(400)
        .json({ success: false, message: 'Only COD payments can be marked collected' });
    }

    const prevPayment = order.payment.status;
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
    await order.save();

    await logAudit(req, 'COD_COLLECTED', 'Order', order._id, prevPayment, 'paid');

    return res
      .status(200)
      .json({ success: true, message: 'COD payment marked as COLLECTED', data: order });
  } catch (err) {
    console.error('COD collection error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/orders/:id/return-action — Admin approves or rejects return
exports.handleReturnAction = async (req, res) => {
  const { action, staffNotes } = req.body;

  if (!action || !['approved', 'rejected'].includes(action)) {
    return res
      .status(400)
      .json({ success: false, message: 'Action parameter must be \'approved\' or \'rejected\'' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'return_requested') {
      return res.status(400).json({
        success: false,
        message: 'Return action is only allowed for return_requested orders'
      });
    }

    const previousStatus = order.status;
    const targetStatus = action === 'approved' ? 'return_approved' : 'return_rejected';

    order.status = targetStatus;
    if (staffNotes) {
      order.staffNotes = staffNotes;
    }
    order.timeline.push({
      status: targetStatus,
      updatedBy: req.user._id
    });

    if (action === 'approved') {
      // Restore stock levels
      await rollbackStock(
        order.items.map((item) => ({ productId: item.product, quantity: item.quantity }))
      );
      order.payment.status = 'refunded';
      order.payment.refundAmount = order.grandTotal;
      order.payment.refundedAt = new Date();
    }

    await order.save();

    await createNotification(
      order.customer,
      action === 'approved' ? 'refund_initiated' : 'order_cancelled',
      `Return Request ${action.toUpperCase()}`,
      `Your return request for order ${order.orderNumber} has been ${action.toUpperCase()}.`,
      `/my-orders/${order._id}`
    );

    await logAudit(req, 'RETURN_ACTION', 'Order', order._id, previousStatus, targetStatus);

    return res
      .status(200)
      .json({ success: true, message: `Return request ${action} successfully`, data: order });
  } catch (err) {
    console.error('Return action error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Server error during return validation' });
  }
};

/**
 * GET /api/orders/my-orders/:id/invoice
 * Generates (if missing) and returns the GST invoice PDF URL.
 */
exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id }).populate(
      'customer'
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.invoiceUrl) {
      return res.json({ success: true, url: order.invoiceUrl });
    }

    // Generate on-the-fly
    const invoiceService = require('../services/invoice.service');
    const url = await invoiceService.generateAndUploadInvoice(order);
    order.invoiceUrl = url;
    await order.save();

    return res.json({ success: true, url });
  } catch (error) {
    console.error('Invoice download handler failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoice.' });
  }
};
