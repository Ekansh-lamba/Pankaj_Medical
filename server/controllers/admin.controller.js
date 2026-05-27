const User = require('../models/User');

/**
 * PUT /api/admin/users/:id/role
 * Admin — change user role
 */
exports.changeUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['customer', 'staff', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        role,
        permissions: role === 'staff' ? {
          manageOrders: false,
          verifyPrescriptions: false,
          manageInventory: false,
          viewReports: false,
          manageProducts: false
        } : {}
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, data: user, message: `User role updated to ${role}` });
  } catch (err) {
    console.error('Change user role error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
};

/**
 * GET /api/admin/users?search=email&role=customer
 * Admin — Search/list users by email search and role
 */
exports.searchUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    const filter = { isDeleted: false };
    
    if (role) {
      filter.role = role;
    }
    
    if (search) {
      // Search by email case-insensitively using regex
      filter.email = { $regex: search, $options: 'i' };
    }
    
    const users = await User.find(filter).select('-passwordHash').limit(15).lean();
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error('Search users error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
