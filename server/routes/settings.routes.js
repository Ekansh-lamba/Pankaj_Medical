const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings
} = require('../controllers/settings.controller');

// Public settings route
router.get('/public', getPublicSettings);

// Protected admin settings routes
router.get('/admin', protect, requireRole(['admin']), getAdminSettings);
router.put('/admin', protect, requireRole(['admin']), updateAdminSettings);

module.exports = router;
