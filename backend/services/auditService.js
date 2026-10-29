const AuditLog = require('../models/AuditLog');
const { mockAuditLogs } = require('../mockData');

/**
 * Strips sensitive keys like passwords, tokens, secrets from audit metadata.
 */
function sanitizeMetadata(data) {
  if (!data || typeof data !== 'object') return {};
  const sanitized = {};
  const SENSITIVE_KEYS = ['password', 'oldpassword', 'newpassword', 'token', 'jwt', 'secret', 'smtp_pass'];

  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      continue;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Log an audit action safely.
 */
async function logAudit({
  actor = 'System',
  actorEmail = '',
  actorRole = 'System',
  action,
  entityType,
  entityId = '',
  metadata = {}
}) {
  try {
    const cleanMeta = sanitizeMetadata(metadata);
    const logEntry = {
      actor: String(actor || 'System'),
      actorEmail: String(actorEmail || ''),
      actorRole: String(actorRole || 'System'),
      action,
      entityType,
      entityId: String(entityId || ''),
      metadata: cleanMeta,
      createdAt: new Date().toISOString()
    };

    if (global.useMockData) {
      logEntry._id = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      logEntry.id = logEntry._id;
      if (Array.isArray(mockAuditLogs)) {
        mockAuditLogs.unshift(logEntry);
      }
      return logEntry;
    }

    const doc = new AuditLog({
      ...logEntry,
      createdAt: new Date()
    });
    await doc.save();
    return doc;
  } catch (err) {
    // Audit failures must never crash the primary operation
    console.error('Audit log failed silently:', err.message);
    return null;
  }
}

module.exports = {
  logAudit,
  sanitizeMetadata
};

