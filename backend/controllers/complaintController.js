const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Counter = require('../models/Counter');
const path = require('path');
const fs = require('fs');
const { mockComplaints, findMockUserById, getNextComplaintId } = require('../mockData');
const { logAudit } = require('../services/auditService');
const { sendComplaintSubmittedEmail, sendComplaintStatusChangedEmail } = require('../services/emailService');
const { getClientIp, maskIp, parseUserAgent } = require('../utils/clientInfo');

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
    locationDetails: complaint.locationDetails || {
      district: complaint.district || '',
      town: '',
      landmarkDescription: '',
      address: complaint.location || '',
      additionalNotes: ''
    },
    reporterContact: complaint.reporterContact || {
      nic: null,
      phone: null,
      phoneProvided: false,
      phoneVerified: false
    },
    submissionMetadata: complaint.submissionMetadata ? { ...complaint.submissionMetadata } : undefined,
    isEmergency: Boolean(complaint.isEmergency),
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

const initComplaintCounterIfNeeded = async () => {
  try {
    const allComplaints = await Complaint.find({}, { complaintId: 1 });
    let maxNum = 0;
    allComplaints.forEach((c) => {
      if (c.complaintId) {
        const match = String(c.complaintId).match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    const existing = await Counter.findById('complaintId');
    if (!existing) {
      await Counter.create({ _id: 'complaintId', seq: maxNum });
      console.log(`[Counter] Created complaintId sequence initialized at ${maxNum}`);
    } else if (existing.seq < maxNum) {
      await Counter.findByIdAndUpdate('complaintId', { $set: { seq: maxNum } });
      console.log(`[Counter] Synchronized complaintId sequence forward to ${maxNum}`);
    }
  } catch (err) {
    console.error('[Counter] Error checking/synchronizing counter:', err.message);
  }
};

const generateComplaintId = async () => {
  if (global.useMockData) {
    return getNextComplaintId();
  }

  // Ensure counter is initialized and synchronized with highest existing ID
  await initComplaintCounterIfNeeded();

  const updated = await Counter.findByIdAndUpdate(
    'complaintId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `CCMS-${String(updated.seq).padStart(6, '0')}`;
};

const submitComplaint = async (req, res) => {
  try {
    const {
      title,
      category,
      district,
      incidentDate,
      incidentTime,
      location,
      description,
      suspectDetails,
      witnessDetails,
      isAnonymous,
      town,
      landmarkDescription,
      address,
      additionalNotes,
      nic,
      phone,
      isEmergency
    } = req.body;

    const isUrgent = isEmergency === true || isEmergency === 'true' || String(category || '').toLowerCase() === 'emergency';

    const districtStr = district ? String(district).trim() : '';
    const townStr = town ? String(town).trim() : '';
    const landmarkStr = landmarkDescription ? String(landmarkDescription).trim() : '';
    const addressStr = address ? String(address).trim() : '';
    const notesStr = additionalNotes ? String(additionalNotes).trim() : '';
    const descStr = description ? String(description).trim() : '';

    if (isUrgent) {
      if (!districtStr || !townStr || !landmarkStr || !descStr) {
        return res.status(400).json({
          message: 'District, Town/City, Nearby Landmark/Location Description, and Incident Description are required for emergency reports.'
        });
      }
    } else {
      const hasLocation = Boolean(location && String(location).trim()) || (townStr && landmarkStr);
      if (!title || !category || !districtStr || !incidentDate || !hasLocation || !descStr) {
        return res.status(400).json({
          message: 'Title, category, district, incident date, location, and description are required.'
        });
      }
    }

    // Optional NIC Validation
    let cleanNic = null;
    if (nic !== undefined && nic !== null && String(nic).trim() !== '') {
      const nicCandidate = String(nic).trim();
      const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
      if (!nicRegex.test(nicCandidate)) {
        return res.status(400).json({
          message: 'Invalid NIC format. Please enter a valid 9-digit (with V/X) or 12-digit National Identity Card number.'
        });
      }
      cleanNic = nicCandidate;
    }

    // Optional Phone Validation
    let cleanPhone = null;
    if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
      const phoneCandidate = String(phone).trim();
      const strippedPhone = phoneCandidate.replace(/[\s\-()]/g, '');
      const phoneRegex = /^\+?[0-9]{9,15}$/;
      if (!phoneRegex.test(strippedPhone)) {
        return res.status(400).json({
          message: 'Invalid phone number format. Please provide a valid contact number (9-15 digits).'
        });
      }
      cleanPhone = phoneCandidate;
    }

    const reporterContact = {
      nic: cleanNic,
      phone: cleanPhone,
      phoneProvided: Boolean(cleanPhone),
      phoneVerified: false
    };

    // Structured Location Construction
    const locationDetails = {
      district: districtStr,
      town: townStr,
      landmarkDescription: landmarkStr,
      address: addressStr,
      additionalNotes: notesStr
    };

    let compositeLocation = location ? String(location).trim() : '';
    if (!compositeLocation) {
      if (landmarkStr && townStr) {
        compositeLocation = `${landmarkStr}, ${townStr}`;
      } else if (townStr) {
        compositeLocation = townStr;
      } else if (districtStr) {
        compositeLocation = districtStr;
      }
    }

    // Server-observed Technical Metadata (NEVER accept client-supplied req.body.ipAddress)
    const serverIp = getClientIp(req);
    const userAgentHeader = req.headers['user-agent'] || 'Unknown';
    const parsedUa = parseUserAgent(userAgentHeader);

    const submissionMetadata = {
      ipAddress: serverIp,
      userAgent: userAgentHeader,
      deviceType: parsedUa.deviceType,
      browser: parsedUa.browser,
      operatingSystem: parsedUa.operatingSystem,
      submittedAt: new Date(),
      source: req.body.source ? String(req.body.source).trim() : 'Web Portal'
    };

    const finalTitle = title ? String(title).trim() : (isUrgent ? 'Emergency Incident Report' : 'Incident Report');
    const finalCategory = isUrgent ? 'Emergency' : String(category).trim();
    const finalIncidentDate = incidentDate || new Date().toISOString().split('T')[0];
    const finalIncidentTime = incidentTime ? String(incidentTime).trim() : new Date().toTimeString().split(' ')[0].substring(0, 5);

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
        title: finalTitle,
        category: finalCategory,
        district: districtStr,
        incidentDate: finalIncidentDate,
        incidentTime: finalIncidentTime,
        location: compositeLocation,
        locationDetails,
        reporterContact,
        submissionMetadata,
        isEmergency: isUrgent,
        description: descStr,
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
        metadata: { title: finalTitle, category: finalCategory, district: districtStr, isAnonymous: isAnon, isEmergency: isUrgent }
      });

      // Email Notification (Safe non-blocking)
      const citizenEmail = (!isAnon && req.user && req.user.email) ? req.user.email : null;
      if (citizenEmail) {
        sendComplaintSubmittedEmail(citizenEmail, complaint).catch(err => {
          console.error('Email notification background error:', err.message);
        });
      }

      const responsePayload = {
        complaintId,
        title: complaint.title,
        category: complaint.category,
        district: complaint.district,
        status: complaint.status,
        createdAt: complaint.createdAt,
        isAnonymous: complaint.isAnonymous,
        isEmergency: complaint.isEmergency,
        evidenceCount: files.length
      };

      return res.status(201).json({
        message: 'Complaint submitted successfully',
        complaintId,
        complaint: responsePayload
      });
    }

    // Real MongoDB Insertion with Duplicate-Key Self-Recovery (up to 3 retries)
    let savedComplaint = null;
    let complaintId = null;
    let attempts = 0;

    while (attempts < 3 && !savedComplaint) {
      attempts++;
      complaintId = await generateComplaintId();

      try {
        const complaint = new Complaint({
          complaintId,
          user: req.user ? req.user.id : null,
          title: finalTitle,
          category: finalCategory,
          district: districtStr,
          incidentDate: finalIncidentDate,
          incidentTime: finalIncidentTime,
          location: compositeLocation,
          locationDetails,
          reporterContact,
          submissionMetadata,
          isEmergency: isUrgent,
          description: descStr,
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

        savedComplaint = await complaint.save();
      } catch (insertErr) {
        if (insertErr.code === 11000 && attempts < 3) {
          console.warn(`[Complaint] Duplicate complaintId ${complaintId} detected. Resynchronizing counter and retrying...`);
          await initComplaintCounterIfNeeded();
        } else {
          throw insertErr;
        }
      }
    }

    if (!savedComplaint) {
      throw new Error('Failed to generate unique complaint sequence after multiple attempts.');
    }

    // Audit Log
    await logAudit({
      actor: req.user ? req.user.id : (isAnon ? 'Anonymous' : 'Guest'),
      actorEmail: req.user ? req.user.email : '',
      actorRole: req.user ? req.user.role : 'Citizen',
      action: 'COMPLAINT_CREATED',
      entityType: 'Complaint',
      entityId: complaintId,
      metadata: { title: finalTitle, category: finalCategory, district: districtStr, isAnonymous: isAnon, isEmergency: isUrgent }
    });

    // Email Notification (Safe non-blocking)
    if (!isAnon && req.user && req.user.email) {
      sendComplaintSubmittedEmail(req.user.email, savedComplaint).catch(err => {
        console.error('Email notification background error:', err.message);
      });
    }

    const responsePayload = {
      complaintId: savedComplaint.complaintId,
      title: savedComplaint.title,
      category: savedComplaint.category,
      district: savedComplaint.district,
      status: savedComplaint.status || 'Pending',
      createdAt: savedComplaint.createdAt,
      isAnonymous: savedComplaint.isAnonymous,
      isEmergency: savedComplaint.isEmergency,
      evidenceCount: files.length
    };

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaintId: savedComplaint.complaintId,
      complaint: responsePayload
    });
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

      return res.json(complaints.map(serializeComplaint).map(c => {
        delete c.submissionMetadata;
        return c;
      }));
    }

    const complaints = await Complaint.find({ user: req.user.id, isArchived: { $ne: true } })
      .select('-submissionMetadata')
      .sort({ createdAt: -1 });
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
    const isSuperAdmin = req.user && req.user.role === 'SuperAdmin';

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
        const doc = {
          ...item,
          user: complaint.isAnonymous ? null : item.user
        };
        if (doc.submissionMetadata) {
          if (!isSuperAdmin) {
            doc.submissionMetadata.ipAddress = maskIp(doc.submissionMetadata.ipAddress);
          } else {
            doc.submissionMetadata.maskedIp = maskIp(doc.submissionMetadata.ipAddress);
          }
        }
        return doc;
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
      if (doc.submissionMetadata) {
        if (!isSuperAdmin) {
          doc.submissionMetadata.ipAddress = maskIp(doc.submissionMetadata.ipAddress);
        } else {
          doc.submissionMetadata.maskedIp = maskIp(doc.submissionMetadata.ipAddress);
        }
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
    const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin');
    const isSuperAdmin = req.user && req.user.role === 'SuperAdmin';

    if (global.useMockData) {
      const complaint = mockComplaints.find((entry) => entry.complaintId === id || entry._id === id);
      if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

      const serialised = serializeComplaint(complaint);

      if (!isAdmin) {
        const ownerId = complaint.userId ? complaint.userId.toString() : '';
        const currentUserId = req.user?.id ? req.user.id.toString() : (req.user?._id ? req.user._id.toString() : '');
        if (!ownerId || ownerId !== currentUserId) {
          return res.status(403).json({ message: 'Access denied. You can only view your own complaints.' });
        }
        delete serialised.submissionMetadata;
      } else {
        if (complaint.isAnonymous) {
          serialised.user = null;
        }
        if (serialised.submissionMetadata) {
          if (!isSuperAdmin) {
            serialised.submissionMetadata.ipAddress = maskIp(serialised.submissionMetadata.ipAddress);
          } else {
            serialised.submissionMetadata.maskedIp = maskIp(serialised.submissionMetadata.ipAddress);
          }
        }
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

    const doc = complaint.toObject();

    if (!isAdmin) {
      const ownerId = complaint.user?._id ? complaint.user._id.toString() : (complaint.user ? complaint.user.toString() : '');
      const currentUserId = req.user?.id ? req.user.id.toString() : (req.user?._id ? req.user._id.toString() : '');
      if (!ownerId || ownerId !== currentUserId) {
        return res.status(403).json({ message: 'Access denied. You can only view your own complaints.' });
      }
      delete doc.submissionMetadata;
    } else {
      if (complaint.isAnonymous) {
        doc.user = null;
      }
      if (doc.submissionMetadata) {
        if (!isSuperAdmin) {
          doc.submissionMetadata.ipAddress = maskIp(doc.submissionMetadata.ipAddress);
        } else {
          doc.submissionMetadata.maskedIp = maskIp(doc.submissionMetadata.ipAddress);
        }
      }
    }

    res.json(doc);
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
      delete serialized.submissionMetadata;
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
    delete complaintDoc.submissionMetadata;
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
