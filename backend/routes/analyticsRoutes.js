const express = require('express');
const router = express.Router();
const { getAnalyticsOverview, getPublicStats } = require('../controllers/analyticsController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Protected Admin/SuperAdmin Analytics
router.get('/overview', authMiddleware, adminMiddleware, getAnalyticsOverview);

// Safe Public Statistics
router.get('/public', getPublicStats);

module.exports = router;

