const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authMiddleware, superAdminMiddleware } = require('../middleware/authMiddleware');

// SuperAdmin Only: Access Audit Logs
router.get('/', authMiddleware, superAdminMiddleware, getAuditLogs);

module.exports = router;

