const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true }, // snapshot at time of adding
  mrp: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  rxType: { type: String, required: true },
  image: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  addedAt: { type: Date, default: Date.now }
});

const CartSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [CartItemSchema],
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Pre-save to auto update updatedAt
CartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Cart = mongoose.model('Cart', CartSchema);
module.exports = Cart;
