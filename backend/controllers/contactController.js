const ContactInquiry = require('../models/ContactInquiry');
const mongoose = require('mongoose');
const { mockContactInquiries } = require('../mockData');
const { logAudit } = require('../services/auditService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STATUSES = ['New', 'Read', 'Resolved'];

/**
 * Public: Submit a new contact inquiry
 * POST /api/contact
 */
const submitContactInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate Name (2 - 100 characters)
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ message: 'Full name is required and must be between 2 and 100 characters.' });
    }

    // Validate Email
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    // Validate Phone (optional, max 30 chars if provided)
    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || phone.trim().length > 30) {
        return res.status(400).json({ message: 'Phone number format is invalid.' });
      }
    }

    // Validate Subject (3 - 150 characters)
    if (!subject || typeof subject !== 'string' || subject.trim().length < 3 || subject.trim().length > 150) {
      return res.status(400).json({ message: 'Subject is required and must be between 3 and 150 characters.' });
    }

    // Validate Message (10 - 3000 characters)
    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 3000) {
      return res.status(400).json({ message: 'Message details are required and must be between 10 and 3000 characters.' });
    }

    const cleanData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject.trim(),
      message: message.trim(),
      status: 'New'
    };

    if (global.useMockData) {
      const newMockInquiry = {
        _id: `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        id: `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...cleanData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockContactInquiries.unshift(newMockInquiry);
      return res.status(201).json({
        message: 'Your message has been submitted successfully.',
        inquiryId: newMockInquiry._id
      });
    }

    const inquiry = new ContactInquiry(cleanData);
    const saved = await inquiry.save();

    res.status(201).json({
      message: 'Your message has been submitted successfully.',
      inquiryId: saved._id
    });
  } catch (error) {
    console.error('Error submitting contact inquiry:', error);
    res.status(500).json({ message: 'Server error occurred while submitting inquiry.' });
  }
};

/**
 * Admin: Get all contact inquiries (newest first, optional search & status filter)
 * GET /api/contact
 */
const getAllInquiries = async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;
    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    if (global.useMockData) {
      let filtered = [...mockContactInquiries];

      if (status && ALLOWED_STATUSES.includes(status)) {
        filtered = filtered.filter(item => item.status === status);
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const queryTerm = search.trim().toLowerCase();
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(queryTerm) ||
          item.email.toLowerCase().includes(queryTerm) ||
          item.subject.toLowerCase().includes(queryTerm)
        );
      }

      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total = filtered.length;
      const resultList = isPaginated
        ? filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum)
        : filtered;

      if (isPaginated) {
        return res.json({
          data: resultList,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1
          }
        });
      }

      return res.json(resultList);
    }

    const filter = {};
    if (status && ALLOWED_STATUSES.includes(status)) {
      filter.status = status;
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { subject: regex }
      ];
    }

    const total = await ContactInquiry.countDocuments(filter);
    let query = ContactInquiry.find(filter).sort({ createdAt: -1 });

    if (isPaginated) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const inquiries = await query;

    if (isPaginated) {
      return res.json({
        data: inquiries,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching contact inquiries:', error);
    res.status(500).json({ message: 'Server error occurred while retrieving inquiries.' });
  }
};

/**
 * Admin: Get single inquiry by ID
 * GET /api/contact/:id
 */
const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (global.useMockData) {
      const inquiry = mockContactInquiries.find(item => item._id === id || item.id === id);
      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found.' });
      }
      return res.json(inquiry);
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    const inquiry = await ContactInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    res.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry details:', error);
    res.status(500).json({ message: 'Server error occurred while retrieving inquiry details.' });
  }
};

/**
 * Admin: Update inquiry status (New -> Read -> Resolved)
 * PUT /api/contact/:id/status
 */
const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Allowed values: New, Read, Resolved.'
      });
    }

    if (global.useMockData) {
      const inquiry = mockContactInquiries.find(item => item._id === id || item.id === id);
      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found.' });
      }

      const previousStatus = inquiry.status;
      inquiry.status = status;
      inquiry.updatedAt = new Date().toISOString();

      await logAudit({
        actor: req.user ? req.user.id : 'Admin',
        actorEmail: req.user ? req.user.email : '',
        actorRole: req.user ? req.user.role : 'Admin',
        action: 'CONTACT_STATUS_CHANGED',
        entityType: 'ContactInquiry',
        entityId: inquiry._id || inquiry.id,
        metadata: { previousStatus, newStatus: status, inquirerEmail: inquiry.email }
      });

      return res.json({
        message: 'Inquiry status updated successfully.',
        inquiry
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    const currentDoc = await ContactInquiry.findById(id);
    if (!currentDoc) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    const previousStatus = currentDoc.status;
    currentDoc.status = status;
    const inquiry = await currentDoc.save();

    await logAudit({
      actor: req.user ? req.user.id : 'Admin',
      actorEmail: req.user ? req.user.email : '',
      actorRole: req.user ? req.user.role : 'Admin',
      action: 'CONTACT_STATUS_CHANGED',
      entityType: 'ContactInquiry',
      entityId: String(inquiry._id),
      metadata: { previousStatus, newStatus: status, inquirerEmail: inquiry.email }
    });

    res.json({
      message: 'Inquiry status updated successfully.',
      inquiry
    });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ message: 'Server error occurred while updating status.' });
  }
};

module.exports = {
  submitContactInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus
};

