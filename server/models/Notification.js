const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_confirmed',
        'order_packed',
        'order_shipped',
        'order_delivered',
        'order_cancelled',
        'prescription_approved',
        'prescription_rejected',
        'prescription_reupload',
        'return_received',
        'refund_initiated',
        'low_stock',
        'new_rx_order'
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // e.g. "/my-orders/PM-2026-00142"
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
