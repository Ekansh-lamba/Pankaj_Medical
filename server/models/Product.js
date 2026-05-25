const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true }, // Auto-generated
    brand: { type: String, required: true, trim: true },
    manufacturer: { type: String, trim: true },
    composition: { type: String, trim: true }, // Salt/generic name e.g. "Ranitidine 150mg"
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
    dosage: { type: String, trim: true },
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    rxType: {
      type: String,
      required: true,
      enum: ['OTC', 'H', 'NRX', 'H1'],
      default: 'OTC'
    },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    expiryDate: { type: Date },
    batchNumber: { type: String, trim: true },
    hsnCode: { type: String, trim: true },
    gstRate: {
      type: Number,
      required: true,
      enum: [5, 12, 18],
      default: 12
    },
    images: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (v) => v.length <= 3,
          msg: 'A product can have a maximum of 3 images.'
        }
      ]
    },
    description: { type: String },
    sideEffects: { type: String },
    storageInstructions: { type: String },
    rackLocation: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isHidden: { type: Boolean, default: false },
    substitutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    tags: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Slug auto-generation pre-validation hook
ProductSchema.pre('validate', async function (next) {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    
    // Check if slug already exists to prevent collisions
    try {
      const ProductModel = mongoose.model('Product');
      let slugExists = await ProductModel.findOne({ slug: baseSlug });
      if (slugExists && slugExists._id.toString() !== this._id.toString()) {
        const uniqueSuffix = Math.random().toString(36).substring(2, 7);
        this.slug = `${baseSlug}-${uniqueSuffix}`;
      } else {
        this.slug = baseSlug;
      }
    } catch (err) {
      // Model might not be compiled yet, fallback to direct assign or direct generate
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      this.slug = `${baseSlug}-${uniqueSuffix}`;
    }
  }
  next();
});

// Text Search Index with Weights
ProductSchema.index(
  { name: 'text', composition: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 10, composition: 8, brand: 5, tags: 3 } }
);

// Secondary Indexes (slug index defined inline via unique:true on field)
ProductSchema.index({ expiryDate: 1, isHidden: 1 });
ProductSchema.index({ rxType: 1 });

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
