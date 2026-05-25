const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, required: true },
    manufacturer: { type: String },
    composition: { type: String },
    category: {
      type: String,
      required: true,
      enum: [
        'Tablets & Capsules',
        'Syrups & Liquids',
        'Injections',
        'Surgical & Devices',
        'Vitamins & Supplements',
        'Baby Care',
        'Personal Care',
        'Ayurvedic & Herbal'
      ]
    },
    form: {
      type: String,
      required: true,
      enum: ['TAB', 'CAP', 'SYP', 'INH', 'GEL', 'CREAM', 'DROP', 'INJ', 'POWDER', 'OTHER']
    },
    dosage: { type: String },
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    rxType: {
      type: String,
      required: true,
      enum: ['OTC', 'H', 'NRX', 'H1']
    },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    expiryDate: { type: Date },
    batchNumber: { type: String },
    hsnCode: { type: String },
    gstRate: {
      type: Number,
      required: true,
      enum: [5, 12, 18]
    },
    images: { type: [String], default: [] },
    description: { type: String },
    sideEffects: { type: String },
    storageInstructions: { type: String },
    rackLocation: { type: String },
    isActive: { type: Boolean, default: true },
    isHidden: { type: Boolean, default: false },
    substitutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    tags: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', composition: 'text', brand: 'text', tags: 'text' });

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
