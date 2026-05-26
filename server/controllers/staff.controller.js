const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');
const emailService = require('../services/email.service');

// Helper to log audit actions
const logAudit = async (req, action, model, targetId, prev, nextVal) => {
  try {
    await AuditLog.create({
      performedBy: req.user._id,
      role: req.user.role,
      action,
      targetModel: model,
      targetId,
      previousValue: prev,
      newValue: nextVal,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging failed in Staff Controller:', err);
  }
};

/**
 * GET /api/staff
 * Admin-only: Retrieves list of all staff and admin accounts
 */
exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await User.find(
      { role: { $in: ['staff', 'admin'] } },
      { passwordHash: 0, passwordResetToken: 0, emailVerificationToken: 0 }
    ).sort({ createdAt: -1 });

    return res.json({ success: true, data: staffList });
  } catch (error) {
    console.error('Get all staff failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve staff list.' });
  }
};

/**
 * POST /api/staff/invite
 * Admin-only: Creates new staff account and emails a temporary password
 */
exports.inviteStaff = async (req, res) => {
  const { name, email, role, permissions } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
  }

  if (!['staff', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role. Must be "staff" or "admin".' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    }

    // Generate secure temporary password
    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 chars hex

    const defaultPermissions = {
      manageOrders: role === 'admin',
      verifyPrescriptions: role === 'admin' || role === 'staff',
      manageInventory: role === 'admin' || role === 'staff',
      viewReports: role === 'admin',
      manageProducts: role === 'admin'
    };

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      role,
      passwordHash: tempPassword, // will be hashed automatically by pre-save hook
      permissions: permissions || defaultPermissions,
      isVerified: true, // auto-verified on admin invite
      authProviders: ['email']
    });

    await newUser.save();

    // Send invitation email with credentials
    try {
      await emailService.sendStaffInvite(newUser.email, newUser.name, tempPassword);
    } catch (mailErr) {
      console.error('Failed to send staff invitation email:', mailErr);
    }

    await logAudit(req, 'INVITE_STAFF', 'User', newUser._id, null, {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.permissions
    });

    return res.status(201).json({
      success: true,
      message: 'Staff invitation email dispatched successfully.',
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    console.error('Invite staff exception:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to complete invitation.' });
  }
};

/**
 * PUT /api/staff/:id/permissions
 * Admin-only: Updates permissions flags for a staff account
 */
exports.updateStaffPermissions = async (req, res) => {
  const { permissions } = req.body;
  if (!permissions) {
    return res.status(400).json({ success: false, message: 'Permissions flags are required.' });
  }

  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate || !['staff', 'admin'].includes(userToUpdate.role)) {
      return res.status(404).json({ success: false, message: 'Staff account not found.' });
    }

    const previousValue = { permissions: userToUpdate.permissions };
    userToUpdate.permissions = {
      ...userToUpdate.permissions.toObject(),
      ...permissions
    };

    await userToUpdate.save();

    await logAudit(req, 'UPDATE_STAFF_PERMISSIONS', 'User', userToUpdate._id, previousValue, {
      permissions: userToUpdate.permissions
    });

    return res.json({
      success: true,
      message: 'Staff permissions updated successfully.',
      data: userToUpdate
    });
  } catch (error) {
    console.error('Update permissions failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to update permissions.' });
  }
};

/**
 * PUT /api/staff/:id/toggle-status
 * Admin-only: Toggle active status of a staff member
 */
exports.toggleStaffStatus = async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate || !['staff', 'admin'].includes(userToUpdate.role)) {
      return res.status(404).json({ success: false, message: 'Staff account not found.' });
    }

    // Admins cannot disable their own account to prevent lockout
    if (userToUpdate._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }

    const previousValue = { isActive: userToUpdate.isActive };
    userToUpdate.isActive = !userToUpdate.isActive;
    await userToUpdate.save();

    await logAudit(req, 'TOGGLE_STAFF_STATUS', 'User', userToUpdate._id, previousValue, {
      isActive: userToUpdate.isActive
    });

    return res.json({
      success: true,
      message: `Staff member account ${userToUpdate.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: userToUpdate
    });
  } catch (error) {
    console.error('Toggle staff status failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle account status.' });
  }
};

/**
 * DELETE /api/staff/:id
 * Admin-only: Permanently delete a staff account
 */
exports.deleteStaff = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete || !['staff', 'admin'].includes(userToDelete.role)) {
      return res.status(404).json({ success: false, message: 'Staff account not found.' });
    }

    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit(req, 'DELETE_STAFF', 'User', userToDelete._id, {
      name: userToDelete.name,
      email: userToDelete.email,
      role: userToDelete.role
    }, null);

    return res.json({ success: true, message: 'Staff account deleted successfully.' });
  } catch (error) {
    console.error('Delete staff account failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete staff account.' });
  }
};
