const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authMiddleware, requirePermission } = require('../middleware/authMiddleware');

// SuperAdmin / Authorized Admin: Access Audit Logs
router.get('/', authMiddleware, requirePermission('viewAuditLogs'), getAuditLogs);

module.exports = router;

