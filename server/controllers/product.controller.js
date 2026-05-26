const { z } = require('zod');
const mongoose = require('mongoose');
const slugify = require('slugify');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const { fetchComposition } = require('../services/openfda.service');
const {
  parseAndValidateCSV,
  parseAndValidatePurchaseOrderFile,
  detectFormFromName
} = require('../services/csv.service');

// Zod Validation Schema for Product
const productValidationSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    brand: z.string().min(1, 'Brand is required'),
    manufacturer: z.string().optional().nullable(),
    composition: z.string().optional().nullable(),
    category: z.enum(
      [
        'Tablets & Capsules',
        'Syrups & Liquids',
        'Injections',
        'Surgical & Devices',
        'Vitamins & Supplements',
        'Baby Care',
        'Personal Care',
        'Ayurvedic & Herbal'
      ],
      { required_error: 'Category is required' }
    ),
    form: z.enum(['TAB', 'CAP', 'SYP', 'INH', 'GEL', 'CREAM', 'DROP', 'INJ', 'POWDER', 'OTHER'], {
      required_error: 'Form is required'
    }),
    dosage: z.string().optional().nullable(),
    mrp: z.number().positive('MRP must be a positive number'),
    sellingPrice: z.number().positive('Selling Price must be a positive number'),
    discount: z.number().min(0).max(100).optional().default(0),
    rxType: z.enum(['OTC', 'H', 'NRX', 'H1']).default('OTC'),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    lowStockThreshold: z.number().int().nonnegative().optional().default(10),
    expiryDate: z.preprocess((arg) => {
      if (!arg) return undefined;
      if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
      return arg;
    }, z.date().optional()),
    batchNumber: z.string().optional().nullable(),
    hsnCode: z.string().optional().nullable(),
    gstRate: z.coerce
      .number()
      .default(12)
      .refine((val) => [5, 12, 18].includes(val), {
        message: 'GST rate must be 5, 12, or 18'
      }),
    images: z.array(z.string()).max(3, 'Max 3 images allowed').optional().default([]),
    description: z.string().optional().nullable(),
    sideEffects: z.string().optional().nullable(),
    storageInstructions: z.string().optional().nullable(),
    rackLocation: z.string().optional().nullable(),
    isActive: z.boolean().optional().default(true),
    tags: z.array(z.string()).optional().default([])
  })
  .refine((data) => data.sellingPrice <= data.mrp, {
    message: 'Selling price cannot exceed MRP',
    path: ['sellingPrice']
  });

// Helper for structured responses
const sendSuccess = (res, data, message = '', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data, message });
};

const sendError = (res, message, errorCode = 'PRODUCT_ERROR', statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message, code: errorCode });
};

/**
 * Audit Logger Helper
 */
const logAuditAction = async (req, action, targetId, prevVal = null, newVal = null) => {
  try {
    await AuditLog.create({
      performedBy: req.user?._id,
      role: req.user?.role,
      action,
      targetModel: 'Product',
      targetId,
      previousValue: prevVal,
      newValue: newVal,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

/**
 * GET /api/products - List products with advanced filters and pagination
 */
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Apply Client Filter (Only show Active & Unhidden products to standard clients/guests)
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      query.isActive = true;
      query.isHidden = false;
    } else {
      // Admin options
      if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
      }
      if (req.query.isHidden !== undefined) {
        query.isHidden = req.query.isHidden === 'true';
      }
    }

    // Apply category & brand filters
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.brand) {
      query.brand = req.query.brand;
    }
    if (req.query.rxType) {
      query.rxType = req.query.rxType;
    }
    if (req.query.inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Price filters
    if (req.query.minPrice || req.query.maxPrice) {
      query.sellingPrice = {};
      if (req.query.minPrice) {
        query.sellingPrice.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.sellingPrice.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // Sorting
    let sortObj = { createdAt: -1 }; // default newest
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
      case 'price_asc':
        sortObj = { sellingPrice: 1 };
        break;
      case 'price_desc':
        sortObj = { sellingPrice: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'name_asc':
        sortObj = { name: 1 };
        break;
      default:
        sortObj = { createdAt: -1 };
      }
    }

    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('substitutes', 'name slug brand sellingPrice mrp stock images rxType');

    const total = await Product.countDocuments(query);

    return sendSuccess(res, {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error listing products:', error);
    return sendError(res, 'An error occurred while listing products.', 'LIST_ERROR', 500);
  }
};

/**
 * GET /api/products/search - Weighted full-text search with score sorting and suggestions mode
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q, suggest } = req.query;
    if (!q || q.trim().length < 2) {
      return sendSuccess(res, []);
    }

    const searchQuery = q.trim();

    // Check if it's autocomplete suggestions mode
    if (suggest === 'true') {
      const suggestions = await Product.find(
        { $text: { $search: searchQuery }, isActive: true, isHidden: false },
        {
          name: 1,
          slug: 1,
          rxType: 1,
          sellingPrice: 1,
          form: 1,
          brand: 1,
          score: { $meta: 'textScore' }
        }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(8);

      return sendSuccess(res, suggestions);
    }

    // Standard Search Mode
    const products = await Product.find(
      { $text: { $search: searchQuery }, isActive: true, isHidden: false },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .populate('substitutes', 'name slug brand sellingPrice stock images rxType');

    return sendSuccess(res, products);
  } catch (error) {
    console.error('Error searching products:', error);
    return sendError(res, 'An error occurred during search.', 'SEARCH_ERROR', 500);
  }
};

/**
 * GET /api/products/:slug - Retrieve single product detail
 */
exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Support fetching by ObjectId (for admin edits) or slug (for public view)
    let query = { slug };
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = { _id: slug };
    }

    const product = await Product.findOne(query).populate(
      'substitutes',
      'name slug brand mrp sellingPrice stock images rxType form'
    );

    if (!product) {
      return sendError(res, 'Product not found.', 'NOT_FOUND', 404);
    }

    // Role-based visibility check: Guests can't see hidden or inactive products
    const isAdmin = req.user && req.user.role === 'admin';
    const isStaff = req.user && req.user.role === 'staff';
    if (!isAdmin && !isStaff && (!product.isActive || product.isHidden)) {
      return sendError(res, 'This product is currently unavailable.', 'PRODUCT_UNAVAILABLE', 403);
    }

    return sendSuccess(res, product);
  } catch (error) {
    console.error('Error retrieving product:', error);
    return sendError(res, 'An error occurred while fetching product details.', 'DETAIL_ERROR', 500);
  }
};

/**
 * POST /api/products - Create a single product (Admin Only)
 */
exports.createProduct = async (req, res) => {
  try {
    const parsedData = productValidationSchema.safeParse(req.body);
    if (!parsedData.success) {
      const errorMsg = parsedData.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return sendError(res, errorMsg, 'VALIDATION_ERROR', 400);
    }

    const productData = parsedData.data;

    // Auto-calculate discount percentage if not custom specified
    if (!productData.discount) {
      const mrp = productData.mrp;
      const selling = productData.sellingPrice;
      productData.discount = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;
    }

    productData.createdBy = req.user._id;

    // Check if near/past expiry immediately to set isHidden
    if (productData.expiryDate) {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (productData.expiryDate <= thirtyDaysFromNow) {
        productData.isHidden = true;
      }
    }

    const product = new Product(productData);
    await product.save();

    // Log to AuditLog
    await logAuditAction(req, 'product_created', product._id, null, product.toObject());

    return sendSuccess(res, product, 'Product created successfully.', 201);
  } catch (error) {
    console.error('Error creating product:', error);
    return sendError(
      res,
      error.message || 'An error occurred while creating the product.',
      'CREATE_ERROR',
      500
    );
  }
};

/**
 * PUT /api/products/:id - Update product details (Admin Only)
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid product identifier.', 'INVALID_ID', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found.', 'NOT_FOUND', 404);
    }

    const updateData = req.body;

    // MRP/Selling price discount recalcs
    if (updateData.mrp || updateData.sellingPrice) {
      const mrp = updateData.mrp !== undefined ? updateData.mrp : product.mrp;
      const selling =
        updateData.sellingPrice !== undefined ? updateData.sellingPrice : product.sellingPrice;

      if (selling > mrp) {
        return sendError(res, 'Selling Price cannot be greater than MRP.', 'PRICE_ERROR', 400);
      }
      updateData.discount = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;
    }

    // Expiry change sweeps
    if (updateData.expiryDate) {
      const expiry = new Date(updateData.expiryDate);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (expiry <= thirtyDaysFromNow) {
        updateData.isHidden = true;
      } else {
        updateData.isHidden = false; // reset auto-hide if date pushed out
      }
    }

    const prevObj = product.toObject();

    // Apply updates
    Object.keys(updateData).forEach((key) => {
      product[key] = updateData[key];
    });

    await product.save();

    // Log to AuditLog
    await logAuditAction(req, 'product_updated', product._id, prevObj, product.toObject());

    return sendSuccess(res, product, 'Product updated successfully.');
  } catch (error) {
    console.error('Error updating product:', error);
    return sendError(res, 'An error occurred while updating the product.', 'UPDATE_ERROR', 500);
  }
};

/**
 * DELETE /api/products/:id - Soft delete product (Admin Only)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid product identifier.', 'INVALID_ID', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found.', 'NOT_FOUND', 404);
    }

    const prevObj = product.toObject();

    // Soft delete
    product.isActive = false;
    await product.save();

    // Log to AuditLog
    await logAuditAction(req, 'product_deleted', product._id, prevObj, product.toObject());

    return sendSuccess(res, null, 'Product deactivated successfully.');
  } catch (error) {
    console.error('Error deleting product:', error);
    return sendError(res, 'An error occurred while deactivating the product.', 'DELETE_ERROR', 500);
  }
};

/**
 * GET /api/products/openfda-lookup - Generic composition autofill endpoint (Admin Only)
 */
exports.openFdaLookup = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return sendError(res, 'Medicine name is required for OpenFDA queries.', 'NAME_REQUIRED', 400);
    }

    const result = await fetchComposition(name);
    return sendSuccess(res, result);
  } catch (error) {
    console.error('OpenFDA lookup error:', error);
    return sendSuccess(res, null, 'FDA API search timed out or returned no details.');
  }
};

/**
 * GET /api/products/expiry - Fetch expired, near-expiry, expiring soon bucket grids (Admin/Staff)
 */
exports.getExpiryList = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Expired: expiryDate < today
    const expired = await Product.find({
      expiryDate: { $lt: today },
      isActive: true
    }).select('name brand batchNumber expiryDate stock rackLocation isHidden mrp sellingPrice');

    // Near Expiry: today <= expiryDate <= 30 days
    const nearExpiry = await Product.find({
      expiryDate: { $gte: today, $lte: thirtyDaysFromNow },
      isActive: true
    }).select('name brand batchNumber expiryDate stock rackLocation isHidden mrp sellingPrice');

    // Expiring Soon: 31 days <= expiryDate <= 90 days
    const expiringSoon = await Product.find({
      expiryDate: { $gt: thirtyDaysFromNow, $lte: ninetyDaysFromNow },
      isActive: true
    }).select('name brand batchNumber expiryDate stock rackLocation isHidden mrp sellingPrice');

    // Calculate sum of at risk value (sellingPrice * stock for expired and nearExpiry)
    let valueAtRisk = 0;
    expired.forEach((p) => {
      valueAtRisk += (p.sellingPrice || 0) * (p.stock || 0);
    });
    nearExpiry.forEach((p) => {
      valueAtRisk += (p.sellingPrice || 0) * (p.stock || 0);
    });

    return sendSuccess(res, {
      expired,
      nearExpiry,
      expiringSoon,
      valueAtRisk
    });
  } catch (error) {
    console.error('Error fetching expiry lists:', error);
    return sendError(
      res,
      'An error occurred while fetching expiry categories.',
      'EXPIRY_FETCH_ERROR',
      500
    );
  }
};

/**
 * PUT /api/products/:id/toggle-visibility - Manual hide/show override (Admin Only)
 */
exports.toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isHidden, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid product identifier.', 'INVALID_ID', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found.', 'NOT_FOUND', 404);
    }

    const prevObj = product.toObject();
    product.isHidden = isHidden === undefined ? !product.isHidden : isHidden;
    await product.save();

    // Log to AuditLog with manual override reason
    await logAuditAction(
      req,
      `visibility_toggle_${product.isHidden ? 'hide' : 'show'}`,
      product._id,
      prevObj,
      {
        ...product.toObject(),
        overrideReason: reason || 'Manual Admin Overrule'
      }
    );

    return sendSuccess(
      res,
      product,
      `Product successfully ${product.isHidden ? 'hidden from' : 'made visible in'} customer portal.`
    );
  } catch (error) {
    console.error('Error toggling product visibility:', error);
    return sendError(
      res,
      'An error occurred while overriding visibility.',
      'VISIBILITY_TOGGLE_ERROR',
      500
    );
  }
};

/**
 * PUT /api/products/:id/substitutes - Set linked substitutes (Admin Only)
 */
exports.setSubstitutes = async (req, res) => {
  try {
    const { id } = req.params;
    const { substituteIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid product identifier.', 'INVALID_ID', 400);
    }

    if (!Array.isArray(substituteIds)) {
      return sendError(
        res,
        'Substitutes list must be an array of identifiers.',
        'VALIDATION_ERROR',
        400
      );
    }

    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found.', 'NOT_FOUND', 404);
    }

    const prevObj = product.toObject();

    // Verify substituteIds are valid mongoose ObjectIds and not self-linking
    const validSubIds = substituteIds.filter(
      (subId) => mongoose.Types.ObjectId.isValid(subId) && subId !== id
    );

    product.substitutes = validSubIds;
    await product.save();

    await logAuditAction(
      req,
      'product_substitutes_linked',
      product._id,
      prevObj,
      product.toObject()
    );

    return sendSuccess(res, product, 'Medicine substitutes linked successfully.');
  } catch (error) {
    console.error('Error linking substitutes:', error);
    return sendError(
      res,
      'An error occurred while setting product substitutes.',
      'SUBSTITUTE_LINK_ERROR',
      500
    );
  }
};

/**
 * POST /api/products/import-csv - Parse, validate, merge, and bulk import items (Admin Only)
 */
exports.importCSV = async (req, res) => {
  try {
    const previewMode = req.query.preview === 'true';
    const importMode = req.query.importMode || 'catalogue';

    if (!req.file) {
      return sendError(res, 'A stock file is required for bulk imports.', 'FILE_REQUIRED', 400);
    }

    let parsedResult;
    if (importMode === 'purchase_order') {
      parsedResult = parseAndValidatePurchaseOrderFile(req.file.buffer, req.file.originalname);
    } else {
      parsedResult = parseAndValidateCSV(req.file.buffer);
    }

    const { validRows, errors } = parsedResult;

    if (importMode === 'purchase_order') {
      // ── 1. Preview Mode ───────────────────────────────────────────────────
      if (previewMode) {
        // Single batch lookup instead of N individual findOnes
        const names = validRows.map((r) => r.name);
        const existingDocs = await Product.find({}, { name: 1 }).collation({
          locale: 'en',
          strength: 2
        }); // case-insensitive

        const existingNameSet = new Set(existingDocs.map((d) => d.name.toLowerCase()));
        let wouldBeNew = 0;
        let wouldBeUpdated = 0;
        names.forEach((n) => {
          if (existingNameSet.has(n.toLowerCase())) wouldBeUpdated++;
          else wouldBeNew++;
        });

        const warningMsg =
          wouldBeNew > 0
            ? `Purchase Order Import will create ${wouldBeNew} new product(s) as INACTIVE with MRP and selling price set to ₹1.00 (placeholder). Please update pricing in the Products page and activate them before they appear in the customer store.`
            : null;

        return sendSuccess(res, {
          previewRows: validRows.slice(0, 10),
          totalRows: validRows.length,
          errors,
          newCount: wouldBeNew,
          updatedCount: wouldBeUpdated,
          errorCount: errors.length,
          warning: warningMsg
        });
      }

      // ── 2. Bulk Ingest ────────────────────────────────────────────────────
      // Build one bulkWrite operation per product row.
      // $inc increments stock for existing docs and seeds it for new ones.
      // $setOnInsert only fires on upsert (new doc) — never overwrites existing fields.
      const bulkOps = validRows.map((row) => {
        const totalQty = row.quantityPurchased + row.freeQuantity;
        const escaped = row.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        // Generate unique slug: base + short random suffix avoids collision queries
        const baseSlug = slugify(row.name, { lower: true, strict: true });
        const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

        return {
          updateOne: {
            filter: { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
            update: {
              $inc: { stock: totalQty },
              $setOnInsert: {
                name: row.name,
                brand: row.brand || 'Generic',
                slug: uniqueSlug,
                category: 'Tablets & Capsules',
                form: detectFormFromName(row.name),
                mrp: 1.0, // Placeholder — admin must set correct price before activating
                sellingPrice: 1.0,
                discount: 0,
                gstRate: 12,
                rxType: 'OTC',
                isActive: false,
                isHidden: false,
                createdBy: req.user._id
              }
            },
            upsert: true
          }
        };
      });

      const bulkResult = await Product.bulkWrite(bulkOps, { ordered: false });

      const imported = bulkResult.upsertedCount || 0;
      const updated = bulkResult.modifiedCount || 0;

      await logAuditAction(req, 'po_bulk_import_completed', null, null, {
        importedCount: imported,
        updatedCount: updated,
        skippedCount: errors.length,
        totalProducts: validRows.length
      });

      const finalWarning =
        imported > 0
          ? `Import complete. Created ${imported} new product(s) with INACTIVE status and ₹1.00 placeholder pricing. Go to Admin → Products to set correct MRP and selling price before activating.`
          : null;

      return sendSuccess(
        res,
        {
          imported,
          updated,
          skipped: errors.length,
          errors,
          warning: finalWarning
        },
        `Purchase Order bulk import complete — ${imported} created, ${updated} stock-updated.`
      );
    }

    // --- Existing Catalogue Ingestion Flow ---
    if (previewMode) {
      return sendSuccess(res, {
        previewRows: validRows.slice(0, 10),
        totalRows: validRows.length + Math.round(errors.length / 2),
        errors,
        newCount: validRows.length,
        errorCount: errors.length
      });
    }

    let imported = 0;
    let updated = 0;

    for (const row of validRows) {
      const existingProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${row.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
        brand: {
          $regex: new RegExp(`^${row.brand.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')
        }
      });

      if (existingProduct) {
        const prevObj = existingProduct.toObject();

        existingProduct.mrp = row.mrp;
        existingProduct.sellingPrice = row.sellingPrice;
        existingProduct.discount = row.discount;
        existingProduct.stock = row.stock;
        existingProduct.expiryDate = row.expiryDate;
        existingProduct.batchNumber = row.batchNumber;
        existingProduct.hsnCode = row.hsnCode;
        existingProduct.gstRate = row.gstRate;
        existingProduct.rackLocation = row.rackLocation;
        existingProduct.isActive = true;

        if (row.expiryDate) {
          const today = new Date();
          const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          existingProduct.isHidden = row.expiryDate <= thirtyDaysFromNow;
        }

        await existingProduct.save();
        updated++;

        await logAuditAction(
          req,
          'csv_import_row_update',
          existingProduct._id,
          prevObj,
          existingProduct.toObject()
        );
      } else {
        const newProduct = new Product({
          ...row,
          createdBy: req.user._id
        });

        if (row.expiryDate) {
          const today = new Date();
          const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          newProduct.isHidden = row.expiryDate <= thirtyDaysFromNow;
        }

        await newProduct.save();
        imported++;

        await logAuditAction(
          req,
          'csv_import_row_create',
          newProduct._id,
          null,
          newProduct.toObject()
        );
      }
    }

    await logAuditAction(req, 'csv_bulk_import_completed', null, null, {
      importedCount: imported,
      updatedCount: updated,
      skippedCount: errors.length
    });

    return sendSuccess(
      res,
      {
        imported,
        updated,
        skipped: errors.length,
        errors
      },
      'CSV bulk stock import completed successfully.'
    );
  } catch (error) {
    console.error('File import error:', error);
    return sendError(
      res,
      error.message || 'An error occurred during file parsing.',
      'IMPORT_ERROR',
      500
    );
  }
};

/**
 * GET /api/products/import-template - Generate downloadable CSV template sample (Admin Only)
 */
exports.downloadCSVTemplate = async (req, res) => {
  try {
    const importMode = req.query.importMode || 'catalogue';

    if (importMode === 'purchase_order') {
      const headers = [
        'Product name',
        'Supplier/Party name',
        'Supplier GSTIN',
        'Quantity purchased',
        'Free quantity',
        'Net amount paid'
      ];
      const sampleRow1 = ['PAN-D CAP', 'ALKEM', '27AAAAA1111A1Z1', '50', '5', '4500.00'];
      const sampleRow2 = ['ACILOC-150MG TAB', 'CADILA', '27BBBBB2222B2Z2', '100', '10', '1200.00'];
      const csvContent = [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=pankaj_purchase_order_template.csv'
      );
      return res.status(200).send(csvContent);
    }

    const headers = [
      'name',
      'brand',
      'manufacturer',
      'composition',
      'category',
      'form',
      'dosage',
      'mrp',
      'sellingPrice',
      'rxType',
      'stock',
      'expiryDate',
      'batchNumber',
      'hsnCode',
      'gstRate',
      'rackLocation',
      'description',
      'sideEffects',
      'storageInstructions'
    ];

    const sampleRow1 = [
      'ACILOC-150MG TAB',
      'CADILA',
      'Cadila Pharmaceuticals',
      'Ranitidine 150mg',
      'Tablets & Capsules',
      'TAB',
      '150mg',
      '45.50',
      '38.00',
      'OTC',
      '120',
      '12/2027',
      'B1042',
      '3004',
      '12',
      'Rack-A3',
      'Used for acidity relief',
      'Headache, dizziness',
      'Store in dry place'
    ];

    const sampleRow2 = [
      'PAN-D CAP',
      'ALKEM',
      'Alkem Labs',
      'Pantoprazole 40mg + Domperidone 30mg',
      'Tablets & Capsules',
      'CAP',
      '40mg',
      '180.00',
      '162.00',
      'H',
      '50',
      '08/2026',
      'P2391',
      '3004',
      '12',
      'Rack-A5',
      'Prescription antacid capsule',
      'Dry mouth',
      'Protect from light'
    ];

    const sampleRow3 = [
      'BECOSULES CAPSULES',
      'PFIZER',
      'Pfizer India',
      'Vitamin B-Complex',
      'Vitamins & Supplements',
      'CAP',
      'Standard',
      '60.00',
      '54.00',
      'OTC',
      '200',
      '05/2028',
      'BC9902',
      '2936',
      '12',
      'Rack-B2',
      'Daily Vitamin supplements',
      'None reported',
      'Keep cool'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow1.join(','),
      sampleRow2.join(','),
      sampleRow3.join(',')
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pankaj_stock_import_template.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error generating CSV template:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate template.' });
  }
};

/**
 * PUT /api/products/bulk-action
 * Body: { ids: string[], action: 'activate' | 'deactivate' }
 * Activates or deactivates a specific list of product IDs in one bulkWrite call.
 */
exports.bulkAction = async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 'No product IDs provided.', 'VALIDATION_ERROR', 400);
    }
    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return sendError(
        res,
        'Action must be "activate", "deactivate", or "delete".',
        'VALIDATION_ERROR',
        400
      );
    }

    let result;
    if (action === 'delete') {
      result = await Product.deleteMany({ _id: { $in: ids } });
    } else {
      const isActive = action === 'activate';
      result = await Product.updateMany({ _id: { $in: ids } }, { $set: { isActive } });
    }

    const count = action === 'delete' ? result.deletedCount : result.modifiedCount;

    await logAuditAction(req, `bulk_${action}`, null, null, {
      affectedCount: count,
      ids
    });

    return sendSuccess(
      res,
      { modifiedCount: count },
      `${count} product(s) ${action}d successfully.`
    );
  } catch (error) {
    console.error('bulkAction error:', error);
    return sendError(res, 'Bulk action failed.', 'SERVER_ERROR', 500);
  }
};

/**
 * PUT /api/products/bulk-activate-all
 * Activates every product that currently has isActive: false.
 * Intended for the PO-import workflow where all new products arrive inactive.
 */
exports.bulkActivateAll = async (req, res) => {
  try {
    const result = await Product.updateMany({ isActive: false }, { $set: { isActive: true } });

    await logAuditAction(req, 'bulk_activate_all_inactive', null, null, {
      activatedCount: result.modifiedCount
    });

    return sendSuccess(
      res,
      { activatedCount: result.modifiedCount },
      `${result.modifiedCount} inactive product(s) activated successfully.`
    );
  } catch (error) {
    console.error('bulkActivateAll error:', error);
    return sendError(res, 'Failed to activate all inactive products.', 'SERVER_ERROR', 500);
  }
};
