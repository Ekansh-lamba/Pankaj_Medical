const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');

// Helper to upload buffer to Cloudinary using secure streams
const uploadFromBuffer = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'pankaj-medical/prescriptions',
        type: 'authenticated',
        access_mode: 'authenticated',
        resource_type: 'auto'
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error || new Error('Cloudinary upload returned null result'));
        }
      }
    );
    stream.end(fileBuffer);
  });
};

// Helper to generate transient signed Cloudinary URL (1-hour lifespan)
const getSignedUrl = (publicId) => {
  if (!publicId) return '';
  return cloudinary.url(publicId, {
    secure: true,
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
  });
};

// Helper to log audit logs
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

// Helper to create notifications
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

// POST /api/prescriptions/upload — Customer upload
exports.uploadPrescriptionImage = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Missing order reference' });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'Please upload a prescription file buffer' });
  }

  try {
    const order = await Order.findOne({ _id: orderId, customer: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order reference not found' });
    }

    // Upload to Cloudinary private folder
    const result = await uploadFromBuffer(req.file.buffer);

    // Create prescription doc with status pending
    const prescription = new Prescription({
      customer: req.user._id,
      order: orderId,
      imageUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      status: 'pending',
      validUntil: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months expiration
    });

    await prescription.save();

    // Link prescription to order
    order.prescriptions.push(prescription._id);

    // If order was in return_requested/cancelled somehow, don't change, but standard status is pending_approval
    if (order.status === 'pending_payment') {
      order.status = 'pending_approval';
      order.timeline.push({ status: 'pending_approval', updatedBy: req.user._id });
    }

    await order.save();

    await createNotification(
      req.user._id,
      'prescription_reupload', // generic upload trigger
      'Prescription Uploaded Successfully',
      `Your prescription for order ${order.orderNumber} is pending review.`,
      `/my-orders/${order._id}`
    );

    // Notify staff
    const staffMembers = await mongoose.model('User').find({ role: { $in: ['staff', 'admin'] } });
    for (const u of staffMembers) {
      await createNotification(
        u._id,
        'new_rx_order',
        'Prescription Upload Pending',
        `Customer uploaded prescription for order ${order.orderNumber}.`,
        '/staff/prescriptions'
      );
    }

    await logAudit(
      req,
      'UPLOAD_PRESCRIPTION',
      'Prescription',
      prescription._id,
      null,
      prescription
    );

    return res.status(201).json({
      success: true,
      message: 'Prescription uploaded successfully',
      data: {
        ...prescription.toObject(),
        imageUrl: getSignedUrl(prescription.cloudinaryPublicId)
      }
    });
  } catch (err) {
    console.error('Upload prescription error:', err);
    return res
      .status(500)
      .json({ success: false, message: err.message || 'Server error during upload' });
  }
};

// GET /api/prescriptions/my-prescriptions — Customer list own
exports.getMyPrescriptions = async (req, res) => {
  try {
    const list = await Prescription.find({ customer: req.user._id }).sort({ createdAt: -1 });

    // Refresh the signed URLs dynamically so they don't expire
    const refreshedList = list.map((item) => {
      const obj = item.toObject();
      obj.imageUrl = getSignedUrl(item.cloudinaryPublicId);
      return obj;
    });

    return res.status(200).json({ success: true, data: refreshedList });
  } catch (err) {
    console.error('Get my prescriptions error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/prescriptions/pending — Staff review queue
exports.getPendingPrescriptions = async (req, res) => {
  try {
    const list = await Prescription.find({ status: 'pending' })
      .populate('customer', 'name email phone')
      .populate({
        path: 'order',
        select: 'orderNumber items status grandTotal subtotal createdAt'
      })
      .sort({ createdAt: 1 });

    const refreshedList = list.map((item) => {
      const obj = item.toObject();
      obj.imageUrl = getSignedUrl(item.cloudinaryPublicId);
      return obj;
    });

    return res.status(200).json({ success: true, data: refreshedList });
  } catch (err) {
    console.error('Get pending prescriptions error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/prescriptions/:id/approve — Staff approve
exports.approvePrescription = async (req, res) => {
  try {
    const rx = await Prescription.findById(req.params.id);
    if (!rx) {
      return res.status(404).json({ success: false, message: 'Prescription record not found' });
    }

    const previousStatus = rx.status;
    rx.status = 'approved';
    rx.isReusable = true;
    rx.reviewedBy = req.user._id;
    rx.reviewedAt = new Date();
    await rx.save();

    // Check if the order is ready (all prescriptions for the order are approved)
    const order = await Order.findById(rx.order).populate('prescriptions');
    if (order) {
      const allApproved = order.prescriptions.every((p) => p.status === 'approved');
      if (allApproved && order.status === 'pending_approval') {
        order.status = 'confirmed';
        order.timeline.push({ status: 'confirmed', updatedBy: req.user._id });
        await order.save();

        await createNotification(
          order.customer,
          'order_confirmed',
          'Order Confirmed!',
          `All prescriptions approved. Your order ${order.orderNumber} is now confirmed.`,
          `/my-orders/${order._id}`
        );
      }
    }

    await createNotification(
      rx.customer,
      'prescription_approved',
      'Prescription Approved',
      'Your prescription has been approved by our pharmacy staff.',
      `/my-orders/${rx.order}`
    );

    await logAudit(req, 'APPROVE_PRESCRIPTION', 'Prescription', rx._id, previousStatus, 'approved');

    return res
      .status(200)
      .json({ success: true, message: 'Prescription approved successfully', data: rx });
  } catch (err) {
    console.error('Approve prescription error:', err);
    return res.status(500).json({ success: false, message: 'Server error during approval' });
  }
};

// PUT /api/prescriptions/:id/reject — Staff reject with reason
exports.rejectPrescription = async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Rejection reason is required' });
  }

  try {
    const rx = await Prescription.findById(req.params.id);
    if (!rx) {
      return res.status(404).json({ success: false, message: 'Prescription record not found' });
    }

    const previousStatus = rx.status;
    rx.status = 'rejected';
    rx.rejectionReason = reason;
    rx.reviewedBy = req.user._id;
    rx.reviewedAt = new Date();
    await rx.save();

    // Auto-cancel linked order
    const order = await Order.findById(rx.order);
    if (order) {
      order.status = 'cancelled';
      order.cancellationReason = `Prescription Rejected: ${reason}`;
      order.timeline.push({ status: 'cancelled', updatedBy: req.user._id });

      // Mark refund flag
      order.payment.status = 'failed';
      await order.save();

      // Return reserved stock atomically
      for (const item of order.items) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
      }

      await createNotification(
        order.customer,
        'order_cancelled',
        'Order Cancelled — Prescription Rejected',
        `Your order ${order.orderNumber} was cancelled because your prescription was rejected: ${reason}.`,
        `/my-orders/${order._id}`
      );
    }

    await createNotification(
      rx.customer,
      'prescription_rejected',
      'Prescription Rejected',
      `Your prescription was rejected: ${reason}.`,
      `/my-orders/${rx.order}`
    );

    await logAudit(req, 'REJECT_PRESCRIPTION', 'Prescription', rx._id, previousStatus, 'rejected');

    return res
      .status(200)
      .json({ success: true, message: 'Prescription rejected and order cancelled', data: rx });
  } catch (err) {
    console.error('Reject prescription error:', err);
    return res.status(500).json({ success: false, message: 'Server error during rejection' });
  }
};

// PUT /api/prescriptions/:id/request-reupload — Staff request reupload
exports.requestPrescriptionReupload = async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res
      .status(400)
      .json({ success: false, message: 'Re-upload clarification request reason is required' });
  }

  try {
    const rx = await Prescription.findById(req.params.id);
    if (!rx) {
      return res.status(404).json({ success: false, message: 'Prescription record not found' });
    }

    const previousStatus = rx.status;
    rx.status = 'reupload_requested';
    rx.reuploadReason = reason;
    rx.reviewedBy = req.user._id;
    rx.reviewedAt = new Date();
    await rx.save();

    // Order stays pending_approval, notify customer to reupload
    await createNotification(
      rx.customer,
      'prescription_reupload',
      'Action Required: Re-upload Prescription',
      `Please upload a clearer prescription image: ${reason}.`,
      `/my-orders/${rx.order}`
    );

    await logAudit(
      req,
      'REQUEST_REUPLOAD_PRESCRIPTION',
      'Prescription',
      rx._id,
      previousStatus,
      'reupload_requested'
    );

    return res
      .status(200)
      .json({ success: true, message: 'Re-upload request sent successfully', data: rx });
  } catch (err) {
    console.error('Request reupload error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Server error during reupload dispatch' });
  }
};
