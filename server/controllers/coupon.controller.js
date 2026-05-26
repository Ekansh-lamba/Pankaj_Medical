const Coupon = require('../models/Coupon');

/**
 * POST /api/coupons/validate
 * Body: { code, subtotal }
 */
exports.validateCoupon = async (req, res) => {
  const { code, subtotal } = req.body;

  if (!code || typeof subtotal !== 'number') {
    return res
      .status(400)
      .json({ success: false, message: 'Coupon code and subtotal are required.' });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: 'Invalid coupon code. Coupon does not exist.' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'This coupon code is inactive.' });
    }

    // Expiry check
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    // Total usage cap check
    if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
      return res
        .status(400)
        .json({ success: false, message: 'This coupon has reached its maximum usage limit.' });
    }

    // User-specific limit check
    const userUsageCount = coupon.usedBy.filter(
      (id) => id.toString() === req.user._id.toString()
    ).length;
    if (userUsageCount >= coupon.perCustomerLimit) {
      return res.status(400).json({
        success: false,
        message: `You have already used this coupon code the maximum allowed times (${coupon.perCustomerLimit}).`
      });
    }

    // Minimum order value check
    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum subtotal of ₹${coupon.minOrderValue.toFixed(2)}. Current subtotal is ₹${subtotal.toFixed(2)}.`
      });
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = subtotal * (coupon.value / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'flat') {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === 'free_delivery') {
      discount = 0; // Handled separately to waive shipping charge
    }

    return res.status(200).json({
      success: true,
      message: 'Coupon is valid.',
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        minOrderValue: coupon.minOrderValue,
        discount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ success: false, message: 'Error validating coupon.' });
  }
};

/**
 * ADMIN ONLY CRUD ENDPOINTS
 */

// POST /api/coupons
exports.createCoupon = async (req, res) => {
  try {
    const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const coupon = new Coupon({
      ...req.body,
      createdBy: req.user._id
    });

    await coupon.save();
    return res
      .status(201)
      .json({ success: true, message: 'Coupon created successfully.', data: coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Failed to create coupon.' });
  }
};

// GET /api/coupons (Admin list)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve coupons.' });
  }
};

// GET /api/coupons/:id
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    return res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    console.error('Get coupon detail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve coupon details.' });
  }
};

// PUT /api/coupons/:id
exports.updateCoupon = async (req, res) => {
  try {
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
      const existing = await Coupon.findOne({ code: req.body.code, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    return res
      .status(200)
      .json({ success: true, message: 'Coupon updated successfully.', data: coupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Failed to update coupon.' });
  }
};

// DELETE /api/coupons/:id
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    return res.status(200).json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
  }
};
