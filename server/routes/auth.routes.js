const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authRateLimiter } = require('../middleware/rateLimit.middleware');
const {
  validateSignup,
  validateLogin,
  validateGoogleAuth,
  validatePhoneAuth,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/auth.validator');

// Rate-limited Auth Endpoints
router.post('/signup', authRateLimiter, validateSignup, authController.signup);
router.post('/login', authRateLimiter, validateLogin, authController.login);
router.post('/google', authRateLimiter, validateGoogleAuth, authController.googleAuth);
router.post('/phone/verify-otp', authRateLimiter, validatePhoneAuth, authController.phoneVerifyOtp);
router.post(
  '/forgot-password',
  authRateLimiter,
  validateForgotPassword,
  authController.forgotPassword
);
router.post(
  '/reset-password/:token',
  authRateLimiter,
  validateResetPassword,
  authController.resetPassword
);

// Non-rate limited Auth Endpoints (standard operations)
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
