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

/**
 * PUT /api/users/profile
 * Update personal profile details
 */
exports.updateProfile = async (req, res) => {
  const { name, phone, notificationPreferences } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;

    if (phone !== undefined) {
      // Check if phone is already taken
      if (phone && phone !== user.phone) {
        const phoneExists = await User.findOne({ phone, isDeleted: false });
        if (phoneExists) {
          return res
            .status(400)
            .json({
              success: false,
              message: 'Phone number already registered with another account'
            });
        }
      }
      user.phone = phone || undefined;
    }

    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }

    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

/**
 * POST /api/users/addresses
 * Add a new delivery address
 */
exports.addAddress = async (req, res) => {
  const { label, line1, line2, city, state, pinCode, isDefault } = req.body;

  if (!label || !line1 || !city || !state || !pinCode) {
    return res
      .status(400)
      .json({
        success: false,
        message: 'Missing required address fields (label, line1, city, state, pinCode)'
      });
  }

  try {
    // Use the user document already fetched and validated by the protect middleware
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If marked as default, clear previous defaults first
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      label,
      line1,
      line2: line2 || undefined,
      city,
      state,
      pinCode: String(pinCode), // Ensure string even if number accidentally sent
      isDefault: Boolean(isDefault) || user.addresses.length === 0
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses
    });
  } catch (err) {
    console.error('[addAddress] Save failed:');
    console.error('  name   :', err.name);
    console.error('  message:', err.message);
    console.error('  stack  :', err.stack);
    if (err.errors) {
      console.error('  Validation fields:');
      Object.entries(err.errors).forEach(([f, v]) => console.error(`    ${f}: ${v.message}`));
    }
    return res.status(500).json({
      success: false,
      message: `Failed to save address: ${err.message}`,
      code: err.name || 'SERVER_ERROR'
    });
  }
};

/**
 * DELETE /api/users/addresses/:id
 * Delete a saved address
 */
exports.deleteAddress = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const initialLength = user.addresses.length;
    user.addresses = user.addresses.filter((addr) => addr._id.toString() !== id);

    if (user.addresses.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If we deleted the default address, set another one as default
    if (user.addresses.length > 0 && !user.addresses.some((addr) => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: user.addresses
    });
  } catch (err) {
    console.error('Delete address error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/users/change-password
 * Change password for email providers
 */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: 'Current and new passwords are required' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Social sign-in accounts cannot change password directly'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    user.passwordHash = newPassword; // Hooks pre-save will automatically trigger bcrypt hashing
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Server error while resetting password' });
  }
};

/**
 * PUT /api/users/addresses/:id
 * Update an existing delivery address
 */
exports.updateAddress = async (req, res) => {
  const { id } = req.params;
  const { label, line1, line2, city, state, pinCode, isDefault } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const address = user.addresses.id(id);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If marked as default, clear other defaults first
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // Update fields if provided
    if (label !== undefined) address.label = label;
    if (line1 !== undefined) address.line1 = line1;
    if (line2 !== undefined) address.line2 = line2 || undefined;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pinCode !== undefined) address.pinCode = String(pinCode);
    if (isDefault !== undefined) address.isDefault = Boolean(isDefault);

    // Ensure at least one default remains if we set isDefault to false
    if (!user.addresses.some((addr) => addr.isDefault) && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses
    });
  } catch (err) {
    console.error('Update address error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

/**
 * GET /api/users/profile
 * Get current user profile details
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching profile' });
  }
};
