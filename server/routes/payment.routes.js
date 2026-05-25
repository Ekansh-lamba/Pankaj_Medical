const express = require('express');
const router = express.Router();

// Payment routes skeleton (Full Razorpay integration deferred to Phase 4)
router.post('/create-order', (req, res) => {
  res.json({ success: true, message: 'Payment creation placeholder' });
});

module.exports = router;
