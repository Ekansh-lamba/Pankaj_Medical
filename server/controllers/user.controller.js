const User = require('../models/User');
const { clearRefreshTokenCookie } = require('../utils/jwt');

/**
 * DELETE /account
 * Soft delete own customer account and anonymize PII
 */
exports.softDeleteAccount = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User context missing.',
        code: 'UNAUTHORIZED'
      });
    }

    // Trigger the pre-built schema-level anonymization which soft-deletes and removes PII
    await user.anonymize();

    // Clear refresh token cookie so the user session is fully terminated
    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message:
        'Your account has been successfully deleted, and your PII has been fully anonymized. Thank you.'
    });
  } catch (error) {
    console.error('Soft Delete Account Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process account deletion. Please try again later.',
      code: 'ACCOUNT_DELETE_ERROR'
    });
  }
};
