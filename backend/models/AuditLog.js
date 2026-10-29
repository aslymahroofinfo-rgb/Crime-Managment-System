const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: String, default: 'System', index: true },
  actorEmail: { type: String, default: '' },
  actorRole: { type: String, default: 'System', index: true },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_LOGIN',
      'USER_LOGIN_FAILED',
      'COMPLAINT_CREATED',
      'COMPLAINT_UPDATED',
      'COMPLAINT_DELETED_OR_ARCHIVED',
      'COMPLAINT_STATUS_CHANGED',
      'USER_PROMOTED',
      'USER_DELETED_OR_DEACTIVATED',
      'CONTACT_STATUS_CHANGED',
      'PROFILE_UPDATED'
    ],
    index: true
  },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, default: '', index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, index: true }
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
