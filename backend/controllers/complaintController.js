const Complaint = require('../models/Complaint');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { mockComplaints, findMockUserById, getNextComplaintId } = require('../mockData');
const { logAudit } = require('../services/auditService');
const { sendComplaintSubmittedEmail, sendComplaintStatusChangedEmail } = require('../services/emailService');

const uploadsDir = path.resolve(__dirname, '../uploads');

/**
 * Safely unlinks an array of evidence filenames from the uploads directory
 */
const cleanupUploadedFiles = (fileList) => {
  if (!Array.isArray(fileList)) return;
  fileList.forEach((fileName) => {
    try {
      if (!fileName || typeof fileName !== 'string') return;
      const safeName = path.basename(fileName.replace(/\\/g, '/')).trim();
      if (!safeName) return;
      const targetPath = path.resolve(uploadsDir, safeName);
      if (targetPath.startsWith(uploadsDir + path.sep) && fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    } catch (err) {
      console.error(`Failed to clean up evidence file ${fileName}:`, err.message);
    }
  });
};

const serializeComplaint = (complaint) => {
  const user = complaint.userId ? findMockUserById(complaint.userId) : null;

  // Build or preserve status history
  let statusHistory = Array.isArray(complaint.statusHistory) ? [...complaint.statusHistory] : [];
  if (statusHistory.length === 0 && complaint.status) {
    statusHistory.push({
      status: complaint.status,
      changedAt: complaint.createdAt || new Date().toISOString(),
      changedByRole: 'Citizen',
      note: 'Initial incident filing'
    });
  }

  return {
    _id: complaint._id || complaint.complaintId,
    id: complaint.complaintId,
    complaintId: complaint.complaintId,
    user: user ? {
      _id: user.id,
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber
    } : null,
    title: complaint.title,
    category: complaint.category,
    district: complaint.district,
    incidentDate: complaint.incidentDate,
    incidentTime: complaint.incidentTime,
    location: complaint.location,
    description: complaint.description,
    suspectDetails: complaint.suspectDetails || '',
    witnessDetails: complaint.witnessDetails || '',
    evidenceFiles: complaint.evidenceFiles || [],
    isAnonymous: Boolean(complaint.isAnonymous),
    status: complaint.status || 'Pending',
    statusHistory,
    isArchived: Boolean(complaint.isArchived),
    archivedAt: complaint.archivedAt || null,
    archivedBy: complaint.archivedBy || null,
    createdAt: complaint.createdAt || new Date().toISOString(),
    updatedAt: complaint.updatedAt || complaint.createdAt || new Date().toISOString()
  };
};

const generateComplaintId = async () => {
  if (global.useMockData) {
    return getNextComplaintId();
  }

  const count = await Complaint.countDocuments();
  return `CCMS-${String(count + 1).padStart(6, '0')}`;
};

const submitComplaint = async (req, res) => {
  try {
    const { title, category, district, incidentDate, incidentTime, location, description, suspectDetails, witnessDetails, isAnonymous } = req.body;

    if (!title || !category || !district || !incidentDate || !location || !description) {
      return res.status(400).json({ message: 'Title, category, district, incident date, location, and description are required.' });
    }

    const isAnon = isAnonymous === true || isAnonymous === 'true';
    const files = req.files ? req.files.map((file) => file.filename || path.basename(file.path)) : [];

    if (global.useMockData) {
      const complaintId = getNextComplaintId();
      const initialHistory = [
        {
          status: 'Pending',
          changedAt: new Date().toISOString(),
          changedByRole: 'Citizen',
          note: 'Initial incident filing'
        }
      ];

      const complaint = {
        complaintId,
        userId: req.user && req.user.id ? req.user.id : null,
        title: String(title).trim(),
        category: String(category).trim(),
        district: String(district).trim(),
        incidentDate,
        incidentTime: incidentTime ? String(incidentTime).trim() : '',
        location: String(location).trim(),
        description: String(description).trim(),
        suspectDetails: suspectDetails ? String(suspectDetails).trim() : '',
        witnessDetails: witnessDetails ? String(witnessDetails).trim() : '',
        isAnonymous: isAnon,
        evidenceFiles: files,
        status: 'Pending',
        statusHistory: initialHistory,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockComplaints.unshift(complaint);

      // Audit Log
      await logAudit({
        actor: req.user ? req.user.id : (isAnon ? 'Anonymous' : 'Guest'),
        actorEmail: req.user ? req.user.email : '',
        actorRole: req.user ? req.user.role : 'Citizen',
        action: 'COMPLAINT_CREATED',
        entityType: 'Complaint',
        entityId: complaintId,
        metadata: { title, category, district, isAnonymous: isAnon }
      });

      // Email Notification (Safe non-blocking)
      const citizenEmail = (!isAnon && req.user && req.user.email) ? req.user.email : null;
      if (citizenEmail) {
        sendComplaintSubmittedEmail(citizenEmail, complaint).catch(err => {
          console.error('Email notification background error:', err.message);
        });
      }

      return res.status(201).json({ message: 'Complaint submitted successfully', complaintId });
    }

    const complaintId = await generateComplaintId();

    const complaint = new Complaint({
      complaintId,
      user: req.user ? req.user.id : null,
      title: String(title).trim(),
      category: String(category).trim(),
      district: String(district).trim(),
      incidentDate,
      incidentTime: incidentTime ? String(incidentTime).trim() : '',
      location: String(location).trim(),
      description: String(description).trim(),
      suspectDetails: suspectDetails ? String(suspectDetails).trim() : '',
      witnessDetails: witnessDetails ? String(witnessDetails).trim() : '',
      isAnonymous: isAnon,
      evidenceFiles: files,
      status: 'Pending',
      isArchived: false,
      statusHistory: [
        {
          status: 'Pending',
          changedAt: new Date(),
          changedByRole: 'Citizen',
          note: 'Initial incident filing'
        }
      ]
    });

    await complaint.save();

    // Audit Log
    await logAudit({
      actor: req.user ? req.user.id : (isAnon ? 'Anonymous' : 'Guest'),
      actorEmail: req.user ? req.user.email : '',
      actorRole: req.user ? req.user.role : 'Citizen',
      action: 'COMPLAINT_CREATED',
      entityType: 'Complaint',
      entityId: complaintId,
      metadata: { title, category, district, isAnonymous: isAnon }
    });

    // Email Notification (Safe non-blocking)
    if (!isAnon && req.user && req.user.email) {
      sendComplaintSubmittedEmail(req.user.email, complaint).catch(err => {
        console.error('Email notification background error:', err.message);
      });
    }

    res.status(201).json({ message: 'Complaint submitted successfully', complaintId });
  } catch (error) {
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        try {
          const filePath = file.path || path.join(uploadsDir, file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupErr) {
          console.error('Error cleaning up uploaded file on failure:', cleanupErr);
        }
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    if (global.useMockData) {
      const complaints = mockComplaints
        .filter((complaint) => complaint.userId === req.user.id && !complaint.isArchived)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.json(complaints.map(serializeComplaint));
    }

    const complaints = await Complaint.find({ user: req.user.id, isArchived: { $ne: true } }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const { status, district, category, search, includeArchived, page, limit } = req.query;
    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    if (global.useMockData) {
      let filtered = [...mockComplaints];

      if (includeArchived !== 'true') {
        filtered = filtered.filter(c => !c.isArchived);
      }

      if (status && status !== 'all') {
        filtered = filtered.filter(c => String(c.status).toLowerCase() === String(status).toLowerCase());
      }
      if (district && district !== 'all') {
        filtered = filtered.filter(c => String(c.district).toLowerCase() === String(district).toLowerCase());
      }
      if (category && category !== 'all') {
        filtered = filtered.filter(c => String(c.category).toLowerCase() === String(category).toLowerCase());
      }
      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(c =>
          (c.complaintId && c.complaintId.toLowerCase().includes(q)) ||
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q))
        );
      }

      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total = filtered.length;
      const resultList = isPaginated
        ? filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum)
        : filtered;

      const mapped = resultList.map((complaint) => {
        const item = serializeComplaint(complaint);
        return {
          ...item,
          user: complaint.isAnonymous ? null : item.user
        };
      });

      if (isPaginated) {
        return res.json({
          data: mapped,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1
          }
        });
      }

      return res.json(mapped);
    }

    const query = {};
    if (includeArchived !== 'true') {
      query.isArchived = { $ne: true };
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (district && district !== 'all') {
      query.district = district;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { complaintId: regex },
        { title: regex },
        { location: regex },
        { description: regex }
      ];
    }

    const total = await Complaint.countDocuments(query);
    let dbQuery = Complaint.find(query)
      .populate('user', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });

    if (isPaginated) {
      dbQuery = dbQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const complaints = await dbQuery;

    const processedComplaints = complaints.map(c => {
      const doc = c.toObject();
      if (doc.isAnonymous) {
        doc.user = null;
      }
      return doc;
    });

    if (isPaginated) {
      return res.json({
        data: processedComplaints,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(processedComplaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    if (global.useMockData) {
      const complaint = mockComplaints.find((entry) => entry.complaintId === id || entry._id === id);
      if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

      const serialised = serializeComplaint(complaint);
      const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin');

      if (!isAdmin) {
        if (!complaint.userId || complaint.userId !== req.user.id) {
          return res.status(403).json({ message: 'Access denied. You can only view your own complaints.' });
        }
      }

      if (complaint.isAnonymous && isAdmin) {
        serialised.user = null;
      }

      return res.json(serialised);
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(id);
    const complaint = await Complaint.findOne({
      $or: [
        { complaintId: id },
        ...(isObjId ? [{ _id: id }] : [])
      ]
    }).populate('user', 'fullName email phoneNumber');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin');
    if (!isAdmin) {
      if (!complaint.user || complaint.user._id.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You can only view your own complaints.' });
      }
    } else if (complaint.isAnonymous) {
      const doc = complaint.toObject();
      doc.user = null;
      return res.json(doc);
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const trackComplaint = async (req, res) => {
  try {
    const { complaintId, email } = req.body;

    if (!complaintId) {
      return res.status(400).json({ message: 'Complaint ID is required' });
    }

    if (global.useMockData) {
      const complaint = mockComplaints.find((entry) => entry.complaintId === complaintId);
      if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

      const user = complaint.userId ? findMockUserById(complaint.userId) : null;
      const isAnonymous = complaint.isAnonymous || !user;

      if (isAnonymous) {
        // Return only minimal safe tracking information
        return res.json({
          complaintId: complaint.complaintId,
          title: 'Anonymous Incident Report',
          category: complaint.category,
          status: complaint.status,
          incidentDate: complaint.incidentDate || complaint.createdAt,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt || complaint.createdAt,
          isAnonymous: true
        });
      }

      if (!email) {
        return res.status(400).json({ message: 'Registered account email is required to track this complaint' });
      }

      if (user.email.toLowerCase() !== String(email).trim().toLowerCase()) {
        return res.status(403).json({ message: 'Email does not match registered email for this complaint' });
      }

      const serialized = serializeComplaint(complaint);
      delete serialized.evidenceFiles;
      return res.json(serialized);
    }

    const complaint = await Complaint.findOne({ complaintId }).populate('user', 'email fullName phoneNumber');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const isAnonymous = complaint.isAnonymous || !complaint.user;

    if (isAnonymous) {
      // Return only minimal safe tracking information
      return res.json({
        complaintId: complaint.complaintId,
        title: 'Anonymous Incident Report',
        category: complaint.category,
        status: complaint.status,
        incidentDate: complaint.incidentDate || complaint.createdAt,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt || complaint.createdAt,
        isAnonymous: true
      });
    }

    if (!email) {
      return res.status(400).json({ message: 'Registered account email is required to track this complaint' });
    }

    if (!complaint.user.email || complaint.user.email.toLowerCase() !== String(email).trim().toLowerCase()) {
      return res.status(403).json({ message: 'Email does not match registered email for this complaint' });
    }

    const complaintDoc = complaint.toObject ? complaint.toObject() : { ...complaint };
    delete complaintDoc.evidenceFiles;
    res.json(complaintDoc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (global.useMockData) {
      const complaint = mockComplaints.find((entry) => entry._id === id || entry.complaintId === id);
      if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

      const previousStatus = complaint.status;
      complaint.status = status;

      // Append to status history
      if (!Array.isArray(complaint.statusHistory)) {
        complaint.statusHistory = [
          {
            status: previousStatus || 'Pending',
            changedAt: complaint.createdAt || new Date().toISOString(),
            changedByRole: 'Citizen',
            note: 'Initial incident filing'
          }
        ];
      }

      complaint.statusHistory.push({
        status,
        changedBy: req.user ? req.user.id : null,
        changedByRole: req.user ? req.user.role : 'Admin',
        changedByName: req.user ? req.user.fullName : '',
        changedAt: new Date().toISOString(),
        note: note || ''
      });
      complaint.updatedAt = new Date().toISOString();

      // Audit Log
      await logAudit({
        actor: req.user ? req.user.id : 'Admin',
        actorEmail: req.user ? req.user.email : '',
        actorRole: req.user ? req.user.role : 'Admin',
        action: 'COMPLAINT_STATUS_CHANGED',
        entityType: 'Complaint',
        entityId: complaint.complaintId,
        metadata: { previousStatus, newStatus: status, note: note || '' }
      });

      // Email notification (Safe non-blocking)
      const user = complaint.userId ? findMockUserById(complaint.userId) : null;
      if (!complaint.isAnonymous && user && user.email) {
        sendComplaintStatusChangedEmail(user.email, complaint, status, note).catch(err => {
          console.error('Email status notification error:', err.message);
        });
      }

      return res.json({ message: 'Status updated', complaint: serializeComplaint(complaint) });
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(id);
    const complaint = await Complaint.findOne({
      $or: [
        { complaintId: id },
        ...(isObjId ? [{ _id: id }] : [])
      ]
    }).populate('user', 'email fullName');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const previousStatus = complaint.status;
    complaint.status = status;

    if (!Array.isArray(complaint.statusHistory)) {
      complaint.statusHistory = [
        {
          status: previousStatus || 'Pending',
          changedAt: complaint.createdAt || new Date(),
          changedByRole: 'Citizen',
          note: 'Initial incident filing'
        }
      ];
    }

    complaint.statusHistory.push({
      status,
      changedBy: req.user ? req.user.id : null,
      changedByRole: req.user ? req.user.role : 'Admin',
      changedByName: req.user ? req.user.fullName : '',
      changedAt: new Date(),
      note: note || ''
    });

    await complaint.save();

    // Audit Log
    await logAudit({
      actor: req.user ? req.user.id : 'Admin',
      actorEmail: req.user ? req.user.email : '',
      actorRole: req.user ? req.user.role : 'Admin',
      action: 'COMPLAINT_STATUS_CHANGED',
      entityType: 'Complaint',
      entityId: complaint.complaintId,
      metadata: { previousStatus, newStatus: status, note: note || '' }
    });

    // Email notification (Safe non-blocking)
    if (!complaint.isAnonymous && complaint.user && complaint.user.email) {
      sendComplaintStatusChangedEmail(complaint.user.email, complaint, status, note).catch(err => {
        console.error('Email status notification error:', err.message);
      });
    }

    res.json({ message: 'Status updated', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Admin: Soft-archive complaint (preserve physical evidence files on disk)
 */
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    if (global.useMockData) {
      const index = mockComplaints.findIndex((complaint) => complaint._id === id || complaint.complaintId === id);
      if (index === -1) return res.status(404).json({ message: 'Complaint not found' });

      const target = mockComplaints[index];
      // Soft-archive to preserve case record and evidence files on disk
      target.isArchived = true;
      target.archivedAt = new Date().toISOString();
      target.archivedBy = req.user ? req.user.id : 'Admin';

      await logAudit({
        actor: req.user ? req.user.id : 'Admin',
        actorEmail: req.user ? req.user.email : '',
        actorRole: req.user ? req.user.role : 'Admin',
        action: 'COMPLAINT_DELETED_OR_ARCHIVED',
        entityType: 'Complaint',
        entityId: target.complaintId || id,
        metadata: { title: target.title, deletedBy: 'Admin', archived: true }
      });

      return res.json({ message: 'Complaint archived successfully' });
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(id);
    const complaint = await Complaint.findOne({
      $or: [
        { complaintId: id },
        ...(isObjId ? [{ _id: id }] : [])
      ]
    });

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Soft-archive
    complaint.isArchived = true;
    complaint.archivedAt = new Date();
    complaint.archivedBy = req.user ? req.user.id : null;
    await complaint.save();

    await logAudit({
      actor: req.user ? req.user.id : 'Admin',
      actorEmail: req.user ? req.user.email : '',
      actorRole: req.user ? req.user.role : 'Admin',
      action: 'COMPLAINT_DELETED_OR_ARCHIVED',
      entityType: 'Complaint',
      entityId: complaint.complaintId || id,
      metadata: { title: complaint.title, deletedBy: 'Admin', archived: true }
    });

    res.json({ message: 'Complaint archived successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Citizen: Update Pending complaint (strict allowlist of fields)
 */
const updateMyComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, district, incidentDate, incidentTime, location, suspectDetails, witnessDetails } = req.body;

    // Validation of editable fields
    if (title !== undefined && (typeof title !== 'string' || title.trim().length < 5)) {
      return res.status(400).json({ message: 'Title must be at least 5 characters long' });
    }
    if (category !== undefined && (typeof category !== 'string' || !category.trim())) {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (description !== undefined && (typeof description !== 'string' || description.trim().length < 10)) {
      return res.status(400).json({ message: 'Description must be at least 10 characters long' });
    }
    if (description !== undefined && description.length > 1000) {
      return res.status(400).json({ message: 'Description cannot exceed 1000 characters' });
    }
    if (district !== undefined && (typeof district !== 'string' || !district.trim())) {
      return res.status(400).json({ message: 'District is required' });
    }
    if (incidentDate !== undefined && isNaN(new Date(incidentDate).getTime())) {
      return res.status(400).json({ message: 'Valid incident date is required' });
    }
    if (incidentTime !== undefined && (typeof incidentTime !== 'string' || !incidentTime.trim())) {
      return res.status(400).json({ message: 'Incident time is required' });
    }
    if (location !== undefined && (typeof location !== 'string' || !location.trim())) {
      return res.status(400).json({ message: 'Location is required' });
    }

    if (global.useMockData) {
      const complaint = mockComplaints.find((entry) => entry.complaintId === id || entry._id === id);
      if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
      }

      // Ownership check
      if (complaint.isAnonymous || !complaint.userId || String(complaint.userId) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Access denied. You can only edit your own complaints.' });
      }

      // Status check (Pending only)
      if (complaint.status !== 'Pending') {
        return res.status(403).json({
          message: 'This complaint can no longer be edited because it is already being processed.'
        });
      }

      // Strict field allowlist (prevent tampering with status, user, isArchived, etc.)
      if (title !== undefined) complaint.title = title.trim();
      if (category !== undefined) complaint.category = category.trim();
      if (description !== undefined) complaint.description = description.trim();
      if (district !== undefined) complaint.district = district.trim();
      if (incidentDate !== undefined) complaint.incidentDate = incidentDate;
      if (incidentTime !== undefined) complaint.incidentTime = incidentTime.trim();
      if (location !== undefined) complaint.location = location.trim();
      if (suspectDetails !== undefined) complaint.suspectDetails = String(suspectDetails).trim();
      if (witnessDetails !== undefined) complaint.witnessDetails = String(witnessDetails).trim();
      complaint.updatedAt = new Date().toISOString();

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: 'Citizen',
        action: 'COMPLAINT_UPDATED',
        entityType: 'Complaint',
        entityId: complaint.complaintId || id,
        metadata: { title: complaint.title }
      });

      return res.json({
        message: 'Complaint updated successfully',
        complaint: serializeComplaint(complaint)
      });
    }

    // MongoDB Mode
    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(id);
    const complaint = await Complaint.findOne({
      $or: [
        { complaintId: id },
        ...(isObjId ? [{ _id: id }] : [])
      ]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Ownership check
    if (complaint.isAnonymous || !complaint.user || complaint.user.toString() !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied. You can only edit your own complaints.' });
    }

    // Status check
    if (complaint.status !== 'Pending') {
      return res.status(403).json({
        message: 'This complaint can no longer be edited because it is already being processed.'
      });
    }

    // Update strictly whitelisted fields
    if (title !== undefined) complaint.title = title.trim();
    if (category !== undefined) complaint.category = category.trim();
    if (description !== undefined) complaint.description = description.trim();
    if (district !== undefined) complaint.district = district.trim();
    if (incidentDate !== undefined) complaint.incidentDate = incidentDate;
    if (incidentTime !== undefined) complaint.incidentTime = incidentTime.trim();
    if (location !== undefined) complaint.location = location.trim();
    if (suspectDetails !== undefined) complaint.suspectDetails = String(suspectDetails).trim();
    if (witnessDetails !== undefined) complaint.witnessDetails = String(witnessDetails).trim();

    await complaint.save();

    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'Citizen',
      action: 'COMPLAINT_UPDATED',
      entityType: 'Complaint',
      entityId: complaint.complaintId || id,
      metadata: { title: complaint.title }
    });

    res.json({
      message: 'Complaint updated successfully',
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Citizen: Delete Pending complaint and purge associated disk evidence
 */
const deleteMyComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    if (global.useMockData) {
      const index = mockComplaints.findIndex((entry) => entry.complaintId === id || entry._id === id);
      if (index === -1) {
        return res.status(404).json({ message: 'Complaint not found' });
      }

      const complaint = mockComplaints[index];

      // Ownership check
      if (complaint.isAnonymous || !complaint.userId || String(complaint.userId) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Access denied. You can only delete your own complaints.' });
      }

      // Status check (Pending only)
      if (complaint.status !== 'Pending') {
        return res.status(403).json({
          message: 'This complaint can no longer be deleted because it is already being processed.'
        });
      }

      // Safely delete physical evidence files from uploads directory on disk
      cleanupUploadedFiles(complaint.evidenceFiles);

      mockComplaints.splice(index, 1);

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: 'Citizen',
        action: 'COMPLAINT_DELETED_OR_ARCHIVED',
        entityType: 'Complaint',
        entityId: complaint.complaintId || id,
        metadata: { title: complaint.title, deletedBy: 'Citizen', purgedEvidenceCount: (complaint.evidenceFiles || []).length }
      });

      return res.json({ message: 'Complaint deleted successfully' });
    }

    // MongoDB Mode
    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(id);
    const complaint = await Complaint.findOne({
      $or: [
        { complaintId: id },
        ...(isObjId ? [{ _id: id }] : [])
      ]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Ownership check
    if (complaint.isAnonymous || !complaint.user || complaint.user.toString() !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own complaints.' });
    }

    // Status check
    if (complaint.status !== 'Pending') {
      return res.status(403).json({
        message: 'This complaint can no longer be deleted because it is already being processed.'
      });
    }

    // Safely delete physical evidence files from uploads directory on disk
    cleanupUploadedFiles(complaint.evidenceFiles);

    await Complaint.findByIdAndDelete(complaint._id);

    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'Citizen',
      action: 'COMPLAINT_DELETED_OR_ARCHIVED',
      entityType: 'Complaint',
      entityId: complaint.complaintId || id,
      metadata: { title: complaint.title, deletedBy: 'Citizen', purgedEvidenceCount: (complaint.evidenceFiles || []).length }
    });

    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getComplaintEvidence = async (req, res) => {
  try {
    const { id, index } = req.params;

    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0) {
      return res.status(400).json({ message: 'Invalid evidence index. Must be a non-negative integer.' });
    }

    let complaint = null;

    if (global.useMockData) {
      complaint = mockComplaints.find((entry) => entry.complaintId === id || entry._id === id);
    } else {
      const mongoose = require('mongoose');
      const isObjId = mongoose.isValidObjectId(id);
      complaint = await Complaint.findOne({
        $or: [
          { complaintId: id },
          ...(isObjId ? [{ _id: id }] : [])
        ]
      }).populate('user', 'email fullName');
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Authorization Check:
    // Admin or SuperAdmin can access all complaints' evidence
    // Citizen can only access their own non-anonymous complaint's evidence
    const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin');
    let isOwner = false;

    if (global.useMockData) {
      isOwner = Boolean(complaint.userId && String(complaint.userId) === String(req.user.id));
    } else {
      if (complaint.user) {
        const ownerId = complaint.user._id ? complaint.user._id.toString() : complaint.user.toString();
        isOwner = ownerId === String(req.user.id);
      }
    }

    if (!isAdmin && (!isOwner || complaint.isAnonymous)) {
      return res.status(403).json({ message: 'Access denied. You do not have permission to access this evidence.' });
    }

    if (!Array.isArray(complaint.evidenceFiles) || idx >= complaint.evidenceFiles.length) {
      return res.status(404).json({ message: 'Evidence file not found at the specified index.' });
    }

    const rawReference = complaint.evidenceFiles[idx];
    const safeBasename = path.basename(String(rawReference).replace(/\\/g, '/')).trim();

    if (!safeBasename) {
      return res.status(404).json({ message: 'Invalid evidence file reference.' });
    }

    const filePath = path.resolve(uploadsDir, safeBasename);

    // Verify path does not escape the uploads directory (path traversal check)
    if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
      return res.status(403).json({ message: 'Access denied. Invalid file path.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Evidence file not found.' });
    }

    const ext = path.extname(safeBasename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.query.download === 'true' || req.query.download === '1') {
      return res.download(filePath, safeBasename);
    }

    return res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  trackComplaint,
  updateStatus,
  deleteComplaint,
  updateMyComplaint,
  deleteMyComplaint,
  getComplaintEvidence
};
