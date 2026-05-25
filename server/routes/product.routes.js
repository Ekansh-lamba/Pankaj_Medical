const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/product.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Configure Multer memory-storage buffer for file uploader
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB cap
});

// Middleware for optional authentication checks in public listing/detail APIs
const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

// ==========================================
// 1. PUBLIC ROUTES (No Authentication Required)
// ==========================================
router.get('/', optionalProtect, productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/:slug', optionalProtect, productController.getProductBySlug);

// ==========================================
// 2. STAFF & ADMIN ROUTES (Read-Only Expiry)
// ==========================================
router.get('/expiry', protect, requireRole(['admin', 'staff']), productController.getExpiryList);

// ==========================================
// 3. ADMIN-ONLY WRITE ROUTES
// ==========================================
router.post('/', protect, requireRole(['admin']), productController.createProduct);
router.put('/:id', protect, requireRole(['admin']), productController.updateProduct);
router.delete('/:id', protect, requireRole(['admin']), productController.deleteProduct);

// Autocomplete lookup composition service
router.get('/openfda-lookup', protect, requireRole(['admin']), productController.openFdaLookup);

// CSV upload / download operations
router.get('/import-template', protect, requireRole(['admin']), productController.downloadCSVTemplate);
router.post('/import-csv', protect, requireRole(['admin']), upload.single('file'), productController.importCSV);

// Visibility overrides and substitutions
router.put('/:id/toggle-visibility', protect, requireRole(['admin']), productController.toggleVisibility);
router.put('/:id/substitutes', protect, requireRole(['admin']), productController.setSubstitutes);

module.exports = router;
