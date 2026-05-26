const crypto = require('crypto');
const User = require('../models/User');
const admin = require('../config/firebase');
const {
  generateAccessToken,
  generateRefreshToken,
  sendRefreshTokenCookie,
  clearRefreshTokenCookie
} = require('../utils/jwt');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
} = require('../services/email.service');

/**
 * Helper to standardise error handling in try/catch blocks
 */
const handleError = (res, error, defaultMessage, errorCode = 'SERVER_ERROR', statusCode = 500) => {
  console.error(`Auth Controller Error [${errorCode}]:`, error);
  return res.status(statusCode).json({
    success: false,
    message: error.message || defaultMessage,
    code: errorCode
  });
};

/**
 * POST /signup
 * Email + Password Signup
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'An account with this phone number already exists.',
          code: 'PHONE_ALREADY_EXISTS'
        });
      }
    }

    // Determine Role (Strictly checking ADMIN_EMAIL env)
    let role = 'customer';
    if (process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
      role = 'admin';
    }

    // Generate Email Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create User (Pre-save hook will automatically hash the password with 12 salt rounds)
    const user = new User({
      name,
      email,
      phone,
      passwordHash: password, // Schema hook hashes this
      authProviders: ['email'],
      role,
      isVerified: process.env.NODE_ENV === 'development',
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    await user.save();

    // Send Verification Email via Nodemailer
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
      // Do not crash the signup if email sending fails, but inform the user or log it
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    return handleError(res, error, 'An error occurred during signup.', 'SIGNUP_ERROR');
  }
};

/**
 * GET /verify-email/:token
 * Email Verification Link Handler
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #ef4444;">Verification Failed</h1>
          <p>The verification link is invalid or has expired.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px;">Return to Login</a>
        </div>
      `);
    }

    // Verify User
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send Welcome Email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailErr) {
      console.error('Welcome email failed to send:', emailErr.message);
    }

    return res.status(200).send(`
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; max-width: 600px; margin-left: auto; margin-right: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h1 style="color: #0d9488;">Verification Successful!</h1>
        <p>Thank you, ${user.name}. Your email has been successfully verified.</p>
        <p>You can now log in to access your pharmacy dashboard.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-top: 20px;">Go to Login</a>
      </div>
    `);
  } catch (error) {
    console.error('Verify Email Error:', error);
    return res
      .status(500)
      .send('<h3>An internal server error occurred during email verification.</h3>');
  }
};

/**
 * POST /login
 * Email + Password Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check account status
    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Account has been deleted.',
        code: 'ACCOUNT_DELETED'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Verify Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate custom JWTs
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, rememberMe);

    // Save refresh token cookie
    sendRefreshTokenCookie(res, refreshToken, rememberMe);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    return handleError(res, error, 'An error occurred during login.', 'LOGIN_ERROR');
  }
};

/**
 * POST /google
 * Google Firebase Authenticator Verify & Profile Merge
 */
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!admin || !admin.auth) {
      return res.status(500).json({
        success: false,
        message: 'Firebase Authentication service is currently unavailable.',
        code: 'FIREBASE_NOT_CONFIGURED'
      });
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, uid } = decodedToken;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google Account is missing a valid email address.',
        code: 'GOOGLE_EMAIL_MISSING'
      });
    }

    // Search for user by firebaseUid or email
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }]
    });

    if (user) {
      // Account exists, merge Google provider if not already linked
      let changed = false;
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        changed = true;
      }
      if (!user.authProviders.includes('google')) {
        user.authProviders.push('google');
        changed = true;
      }
      if (!user.isVerified) {
        user.isVerified = true; // Verified by Google OAuth
        changed = true;
      }

      if (changed) {
        await user.save();
      }
    } else {
      // Create new customer account
      let role = 'customer';
      if (
        process.env.ADMIN_EMAIL &&
        email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
      ) {
        role = 'admin';
      }

      user = new User({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        firebaseUid: uid,
        authProviders: ['google'],
        role,
        isVerified: true, // Google verifies emails automatically
        isActive: true
      });

      await user.save();
    }

    // Verify active status
    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Account has been deleted.',
        code: 'ACCOUNT_DELETED'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Issue JWTs
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, false);

    sendRefreshTokenCookie(res, refreshToken, false);

    return res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    return handleError(res, error, 'Google token verification failed.', 'GOOGLE_AUTH_ERROR', 400);
  }
};

/**
 * POST /phone/verify-otp
 * Phone Firebase Authenticator Verify & Customer Setup
 */
exports.phoneVerifyOtp = async (req, res) => {
  try {
    const { idToken, name } = req.body;

    if (!admin || !admin.auth) {
      return res.status(500).json({
        success: false,
        message: 'Firebase Authentication service is currently unavailable.',
        code: 'FIREBASE_NOT_CONFIGURED'
      });
    }

    // Verify Firebase Phone ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { phone_number, uid } = decodedToken;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Firebase token is missing a valid phone number context.',
        code: 'PHONE_MISSING'
      });
    }

    // Find User by firebaseUid or phone
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { phone: phone_number }]
    });

    if (user) {
      let changed = false;
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        changed = true;
      }
      if (!user.authProviders.includes('phone')) {
        user.authProviders.push('phone');
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    } else {
      // Create new customer
      user = new User({
        name: name || 'Customer',
        phone: phone_number,
        firebaseUid: uid,
        authProviders: ['phone'],
        role: 'customer',
        isVerified: true, // Phone OTP is verification enough
        isActive: true
      });

      await user.save();
    }

    // Validate Account Status
    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Account has been deleted.',
        code: 'ACCOUNT_DELETED'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Issue JWTs
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, false);

    sendRefreshTokenCookie(res, refreshToken, false);

    return res.status(200).json({
      success: true,
      message: 'Phone verification successful',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    return handleError(res, error, 'Phone OTP token verification failed.', 'PHONE_AUTH_ERROR', 400);
  }
};

/**
 * POST /refresh
 * Token Refresh endpoint using httpOnly Cookie
 */
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Refresh token is missing.',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    let decoded;
    try {
      decoded = jwtVerifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Refresh token has expired or is invalid.',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Account context invalid or deactivated.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Generate new Access Token
    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken
      }
    });
  } catch (error) {
    return handleError(res, error, 'Token refresh failed.', 'REFRESH_ERROR');
  }
};

// Helper for jwt verification to avoid throw breaking routes
const jwtVerifyToken = (token, secret) => {
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, secret);
};

/**
 * POST /logout
 * Clears Refresh Token Cookie
 */
exports.logout = async (req, res) => {
  try {
    clearRefreshTokenCookie(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return handleError(res, error, 'Logout failed.', 'LOGOUT_ERROR');
  }
};

/**
 * POST /forgot-password
 * Triggers Password Reset Email
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Prevent email enumeration: return success response even if email is not found
    if (!user || user.isDeleted) {
      return res.status(200).json({
        success: true,
        message:
          'If an account exists with this email address, a password reset link has been dispatched.'
      });
    }

    // Generate Password Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Dispatch Nodemailer Email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message:
        'If an account exists with this email address, a password reset link has been dispatched.'
    });
  } catch (error) {
    return handleError(res, error, 'Forgot password request failed.', 'FORGOT_PASSWORD_ERROR');
  }
};

/**
 * POST /reset-password/:token
 * Performs Password Overwrite
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user || user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'The password reset token is invalid or has expired.',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Assign new password (pre-save schema hook hashes this with 12 salt rounds)
    user.passwordHash = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.'
    });
  } catch (error) {
    return handleError(res, error, 'Password reset failed.', 'RESET_PASSWORD_ERROR');
  }
};
