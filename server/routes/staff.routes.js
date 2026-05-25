const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Staff routes skeleton (Full staff queues implementation deferred to later phases)
router.get('/orders', protect, requireRole(['staff', 'admin']), (req, res) => {
  res.json({ success: true, message: 'Staff orders queue placeholder' });
});

module.exports = router;
