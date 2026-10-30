const express = require('express');
const router = express.Router();
const { getAnalyticsOverview, getPublicStats } = require('../controllers/analyticsController');
const { authMiddleware, adminMiddleware, requirePermission } = require('../middleware/authMiddleware');

// Protected Admin/SuperAdmin Analytics
router.get('/overview', authMiddleware, adminMiddleware, requirePermission('viewReports'), getAnalyticsOverview);

// Safe Public Statistics
router.get('/public', getPublicStats);

module.exports = router;

