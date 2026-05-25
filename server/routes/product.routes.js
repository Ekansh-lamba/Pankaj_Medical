const express = require('express');
const router = express.Router();

// Product routes skeleton (Full CRUD implementation deferred to Phase 2)
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Products list placeholder' });
});

module.exports = router;
