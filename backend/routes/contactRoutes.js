const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  submitContactInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus
} = require('../controllers/contactController');
const { authMiddleware, adminMiddleware, requirePermission } = require('../middleware/authMiddleware');

// Public submission rate limiter: 25 submissions per 15 mins per IP
const contactSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many contact messages submitted from this IP. Please try again after 15 minutes.' }
});

// Public Endpoint
router.post('/', contactSubmitLimiter, submitContactInquiry);

// Admin-Only Endpoints
router.get('/', authMiddleware, adminMiddleware, requirePermission('manageInquiries'), getAllInquiries);
router.get('/:id', authMiddleware, adminMiddleware, requirePermission('manageInquiries'), getInquiryById);
router.put('/:id/status', authMiddleware, adminMiddleware, requirePermission('manageInquiries'), updateInquiryStatus);

module.exports = router;

