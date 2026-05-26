const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Public validation endpoint for users (requires auth to verify user eligibility)
router.post('/validate', protect, couponController.validateCoupon);

// Administrative CRUD operations
router.post('/', protect, requireRole(['admin']), couponController.createCoupon);
router.get('/', protect, requireRole(['admin']), couponController.getAllCoupons);
router.get('/:id', protect, requireRole(['admin']), couponController.getCouponById);
router.put('/:id', protect, requireRole(['admin']), couponController.updateCoupon);
router.delete('/:id', protect, requireRole(['admin']), couponController.deleteCoupon);

module.exports = router;
