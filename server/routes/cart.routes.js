const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  syncGuestCart,
  clearCart
} = require('../controllers/cart.controller');

// All routes here require customer auth
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeCartItem);
router.post('/sync', syncGuestCart);
router.delete('/clear', clearCart);

module.exports = router;
