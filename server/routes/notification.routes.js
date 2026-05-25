const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// Notification routes skeleton (Full notification dispatch implementation deferred to Phase 4)
router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Notifications list placeholder' });
});

module.exports = router;
