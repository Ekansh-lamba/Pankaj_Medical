const AuditLog = require('../models/AuditLog');

/**
 * GET /api/admin/audit-logs
 * Returns paginated audit log entries, most-recent first.
 * Supports: ?page=1&limit=50&action=&role=&search=
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = { $regex: req.query.action, $options: 'i' };
    if (req.query.role)   filter.role = req.query.role;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
};

/**
 * Helper — call this from any controller to record an audit event.
 * Usage: await auditLog.log(req, 'PRODUCT_UPDATED', 'Product', product._id, oldVal, newVal);
 */
exports.log = async (req, action, targetModel = null, targetId = null, previousValue = null, newValue = null) => {
  try {
    const performedBy = req.user?._id || null;
    const role = req.user?.role || 'unknown';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await AuditLog.create({
      performedBy,
      role,
      action,
      targetModel,
      targetId,
      previousValue,
      newValue,
      ipAddress,
      userAgent
    });
  } catch (err) {
    console.error('Audit log write error (non-fatal):', err.message);
  }
};
