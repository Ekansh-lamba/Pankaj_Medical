const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    action: { type: String, required: true },
    targetModel: { type: String },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
module.exports = AuditLog;
