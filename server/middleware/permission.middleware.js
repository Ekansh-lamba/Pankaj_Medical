const checkStaffPermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User context missing.',
        code: 'UNAUTHORIZED'
      });
    }

    // Admins bypass all staff permissions
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only pharmacy staff can access this resource.',
        code: 'FORBIDDEN'
      });
    }

    if (!req.user.permissions || !req.user.permissions[permissionName]) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You do not have the required staff permission: ${permissionName}`,
        code: 'INSUFFICIENT_STAFF_PERMISSION'
      });
    }

    next();
  };
};

module.exports = { checkStaffPermission };
