const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true }, // snapshot — never change after order placed
  brand: { type: String },
  mrp: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  rxType: { type: String, required: true },
  gstRate: { type: Number, required: true },
  hsnCode: { type: String },
  image: { type: String }
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true }, // auto-generated: PM-YYYY-NNNNN
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    prescriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }],
    status: {
      type: String,
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
      // snapshot of address at time of order
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
    couponCode: String,
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
    staffNotes: String,
    cancellationReason: String,
    returnReason: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    rating: {
      score: Number,
      comment: String,
      ratedAt: Date
    },
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    invoiceUrl: String
  },
  { timestamps: true }
);

// Pre-save hook — generate orderNumber before first save
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const count = await mongoose.model('Order').countDocuments();
      const year = new Date().getFullYear();
      this.orderNumber = `PM-${year}-${String(count + 1).padStart(5, '0')}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
