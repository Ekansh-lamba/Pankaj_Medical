const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

// Protect all user routes
router.delete('/account', protect, userController.softDeleteAccount);

module.exports = router;
