const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { submitComplaint, getMyComplaints, getAllComplaints, getComplaintById, trackComplaint, updateStatus, deleteComplaint, updateMyComplaint, deleteMyComplaint, getComplaintEvidence } = require('../controllers/complaintController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeName = Date.now() + '-' + crypto.randomBytes(8).toString('hex') + ext;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4'];
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
    const err = new Error('Unsupported file type. Allowed: JPG, PNG, PDF and MP4.');
    err.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(err, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file limit
    files: 5 // max 5 files
  }
});

const handleUpload = (req, res, next) => {
  upload.array('evidenceFiles', 5)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds the 10 MB limit.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: 'Maximum 5 evidence files are allowed.' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || 'File upload error.' });
    }
    next();
  });
};

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many complaint submissions. Please try again later.' }
});

const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many tracking attempts. Please try again after 15 minutes.' }
});

const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {}
  }
  next();
};

router.post('/submit', submitLimiter, optionalAuth, handleUpload, submitComplaint);
router.post('/track', trackingLimiter, trackComplaint);

// Protected Citizen Routes
router.get('/my-complaints', authMiddleware, getMyComplaints);
router.put('/my/:id', authMiddleware, updateMyComplaint);
router.delete('/my/:id', authMiddleware, deleteMyComplaint);

// Protected Admin Routes
router.get('/all', authMiddleware, adminMiddleware, getAllComplaints);
router.put('/:id/status', authMiddleware, adminMiddleware, updateStatus);
router.delete('/:id', authMiddleware, adminMiddleware, deleteComplaint);

// Protected Evidence Route (Auth required: Owner or Admin) - MUST BE BEFORE /:id !
router.get('/:id/evidence/:index', authMiddleware, getComplaintEvidence);

// Get single complaint by ID (Auth required) - MUST BE AT THE BOTTOM!
router.get('/:id', authMiddleware, getComplaintById);

module.exports = router;
