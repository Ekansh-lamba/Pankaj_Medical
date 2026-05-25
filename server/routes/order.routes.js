const express = require('express');
const router = express.Router();

// Order routes skeleton (Full order implementation deferred to Phase 3)
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Orders list placeholder' });
});

module.exports = router;
