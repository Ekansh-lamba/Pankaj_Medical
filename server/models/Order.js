const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  mrp: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  rxType: { type: String, required: true },
  gstRate: { type: Number, required: true },
  hsnCode: { type: String }
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    prescriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }],
    status: {
      type: String,
      required: true,
      enum: [
        'pending_payment',
        'payment_failed',
        'pending_approval',
        'confirmed',
        'processing',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'return_requested',
        'return_approved',
        'return_rejected'
      ],
      default: 'pending_payment'
    },
    deliveryType: { type: String, enum: ['delivery', 'pickup'], required: true },
    deliveryAddress: {
      label: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pinCode: String
    },
    deliveryCharge: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    gstTotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    payment: {
      method: { type: String, enum: ['razorpay', 'cod'], required: true },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      paidAt: Date,
      refundedAt: Date,
      refundAmount: Number
    },
    staffNotes: { type: String },
    cancellationReason: { type: String },
    returnReason: { type: String },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    rating: {
      score: { type: Number },
      comment: { type: String },
      ratedAt: { type: Date }
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    invoiceUrl: { type: String }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
