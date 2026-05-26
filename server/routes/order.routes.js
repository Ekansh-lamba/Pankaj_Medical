const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  placeOrder,
  getMyOrders,
  getMyOrderDetail,
  cancelOrder,
  rateOrder,
  requestReturn,
  getAllOrders,
  updateOrderStatus,
  markCodCollected,
  handleReturnAction,
  downloadInvoice
} = require('../controllers/order.controller');

// All routes require auth
router.use(protect);

// Customer endpoints
router.post('/', placeOrder);
router.get('/my-orders', getMyOrders);
router.get('/my-orders/:id', getMyOrderDetail);
router.get('/my-orders/:id/invoice', downloadInvoice);
router.post('/my-orders/:id/cancel', cancelOrder);
router.post('/my-orders/:id/rate', rateOrder);
router.post('/my-orders/:id/return', requestReturn);

// Staff & Admin endpoints
router.get('/', requireRole(['staff', 'admin']), getAllOrders);
router.put('/:id/status', requireRole(['staff', 'admin']), updateOrderStatus);
router.put('/:id/cod-collected', requireRole(['staff', 'admin']), markCodCollected);

// Admin-only endpoints
router.put('/:id/return-action', requireRole(['admin']), handleReturnAction);

module.exports = router;
