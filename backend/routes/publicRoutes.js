const express = require('express');
const router = express.Router();
const { getPublicStats } = require('../controllers/analyticsController');

// Public Safe Statistics
router.get('/stats', getPublicStats);

module.exports = router;

