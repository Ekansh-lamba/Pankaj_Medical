const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed. User not found.',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Contact support.',
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      if (user.isDeleted) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed. Account has been deleted.',
          code: 'ACCOUNT_DELETED'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Access token is invalid or has expired.',
        code: 'UNAUTHORIZED'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Access token is missing.',
      code: 'TOKEN_MISSING'
    });
  }
};

module.exports = { protect };
