const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verify);
router.post('/retry/:orderId', protect, paymentController.retryPayment);
router.post('/refund/:orderId', protect, requireRole(['admin']), paymentController.refundOrder);
router.post('/webhook', paymentController.webhook);

module.exports = router;
