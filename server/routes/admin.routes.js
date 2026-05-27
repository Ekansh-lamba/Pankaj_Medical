const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const productController = require('../controllers/product.controller');
const analyticsController = require('../controllers/analytics.controller');
const auditLogController = require('../controllers/auditLog.controller');
const adminController = require('../controllers/admin.controller');

// Bulk product operations
router.put(
  '/products/bulk-activate',
  protect,
  requireRole(['admin']),
  productController.bulkActivateAll
);
router.put('/products/bulk-action', protect, requireRole(['admin']), productController.bulkAction);

// Business Intelligence & Operations Analytics
router.get('/analytics/summary',      protect, requireRole(['admin']), analyticsController.getSummary);
router.get('/analytics/revenue',      protect, requireRole(['admin']), analyticsController.getRevenueChart);
router.get('/analytics/categories',   protect, requireRole(['admin']), analyticsController.getCategoryShare);
router.get('/analytics/top-products', protect, requireRole(['admin']), analyticsController.getTopProducts);
router.get('/analytics/export-csv',   protect, requireRole(['admin']), analyticsController.exportCSVReport);

// Admin user management & role promotions
router.get('/users', protect, requireRole(['admin']), adminController.searchUsers);
router.put('/users/:id/role', protect, requireRole(['admin']), adminController.changeUserRole);

// Audit Log Viewer
router.get('/audit-logs', protect, requireRole(['admin']), auditLogController.getAuditLogs);

module.exports = router;
