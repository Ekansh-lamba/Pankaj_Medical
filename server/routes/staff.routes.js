const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const staffController = require('../controllers/staff.controller');

// Staff queues (Accessed by Staff & Admins)
router.get('/orders', protect, requireRole(['staff', 'admin']), (req, res) => {
  res.json({ success: true, message: 'Staff orders queue placeholder' });
});

// Administrative Account Operations (Admin Only)
router.get('/',               protect, requireRole(['admin']), staffController.getAllStaff);
router.post('/invite',         protect, requireRole(['admin']), staffController.inviteStaff);
router.put('/:id/permissions', protect, requireRole(['admin']), staffController.updateStaffPermissions);
router.put('/:id/toggle-status', protect, requireRole(['admin']), staffController.toggleStaffStatus);
router.delete('/:id',          protect, requireRole(['admin']), staffController.deleteStaff);

module.exports = router;
