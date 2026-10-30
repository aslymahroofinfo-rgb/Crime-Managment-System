const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { mockUsers, mockComplaints } = require('../mockData');
const { logAudit } = require('../services/auditService');
const { DEFAULT_ADMIN_PERMISSIONS } = require('../middleware/authMiddleware');
const { cleanupEvidenceFiles } = require('../config/storage');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// ============================================================
// 1. GET ALL CITIZEN USERS (Directory)
// ============================================================
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    if (global.useMockData) {
      let users = mockUsers.filter((user) => user.role === 'Citizen');

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        users = users.filter((u) =>
          (u.fullName && u.fullName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q)) ||
          (u.nationalId && u.nationalId.toLowerCase().includes(q)) ||
          (u.citizenId && u.citizenId.toLowerCase().includes(q))
        );
      }

      const total = users.length;
      const paginatedUsers = isPaginated
        ? users.slice((pageNum - 1) * limitNum, pageNum * limitNum)
        : users;

      const usersWithCounts = paginatedUsers.map((user) => ({
        id: user.citizenId || `CIW-USER-${user.id}`,
        dbId: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        nid: user.nationalId,
        isActive: user.isActive !== false,
        role: user.role || 'Citizen',
        createdAt: user.createdAt || new Date().toISOString(),
        address: typeof user.address === 'object' && user.address !== null
          ? `${user.address.no || ''}, ${user.address.street || ''}, ${user.address.city || ''}, ${user.address.district || ''}`
          : user.address,
        cases: mockComplaints.filter((complaint) => complaint.userId === user.id).length
      }));

      if (isPaginated) {
        return res.json({
          data: usersWithCounts,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1
          }
        });
      }

      return res.json(usersWithCounts);
    }

    const filter = { role: 'Citizen' };
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { fullName: regex },
        { email: regex },
        { phoneNumber: regex },
        { nationalId: regex },
        { citizenId: regex }
      ];
    }

    const total = await User.countDocuments(filter);
    let query = User.find(filter).select('-password').sort({ createdAt: -1 });

    if (isPaginated) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const users = await query;
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const cases = await Complaint.countDocuments({ user: user._id });
      return {
        id: user.citizenId || `CIW-USER-${user._id.toString().slice(-4).toUpperCase()}`,
        dbId: String(user._id),
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        nid: user.nationalId,
        isActive: user.isActive !== false,
        role: user.role || 'Citizen',
        createdAt: user.createdAt,
        address: typeof user.address === 'object' && user.address !== null
          ? `${user.address.no || ''}, ${user.address.street || ''}, ${user.address.city || ''}, ${user.address.district || ''}`
          : user.address,
        cases
      };
    }));

    if (isPaginated) {
      return res.json({
        data: usersWithCounts,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(usersWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================================
// 2. GET ALL ADMINISTRATORS (SuperAdmin Only)
// ============================================================
const getAllAdmins = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden. SuperAdmin only.' });
    }

    if (global.useMockData) {
      const admins = mockUsers.filter((user) => user.role === 'Admin' || user.role === 'SuperAdmin');
      const adminsMapped = admins.map((user) => ({
        id: user.citizenId || `CIW-ADMIN-${user.id}`,
        dbId: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        nid: user.nationalId || 'N/A',
        isActive: user.isActive !== false,
        role: user.role,
        permissions: user.permissions || { ...DEFAULT_ADMIN_PERMISSIONS },
        mustChangePassword: Boolean(user.mustChangePassword),
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
        address: typeof user.address === 'object' && user.address !== null
          ? `${user.address.no || ''}, ${user.address.street || ''}, ${user.address.city || ''}, ${user.address.district || ''}`
          : user.address || 'N/A'
      }));

      return res.json(adminsMapped);
    }

    const admins = await User.find({ role: { $in: ['Admin', 'SuperAdmin'] } }).select('-password').sort({ createdAt: -1 });
    const adminsMapped = admins.map(user => {
      const doc = user.toObject();
      return {
        id: user.citizenId || `CIW-ADMIN-${user._id.toString().slice(-4).toUpperCase()}`,
        dbId: String(user._id),
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        nid: user.nationalId || 'N/A',
        isActive: user.isActive !== false,
        role: user.role,
        permissions: doc.permissions || { ...DEFAULT_ADMIN_PERMISSIONS },
        mustChangePassword: Boolean(user.mustChangePassword),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        address: typeof user.address === 'object' && user.address !== null
          ? `${user.address.no || ''}, ${user.address.street || ''}, ${user.address.city || ''}, ${user.address.district || ''}`
          : user.address || 'N/A'
      };
    });

    res.json(adminsMapped);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================================
// 3. GET USER COUNT
// ============================================================
const getUserCount = async (req, res) => {
  try {
    if (global.useMockData) {
      return res.json({ total: mockUsers.length });
    }

    const count = await User.countDocuments();
    res.json({ total: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================================
// 4. CREATE ADMINISTRATOR (SuperAdmin Only)
// ============================================================
const createAdmin = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden. SuperAdmin only.' });
    }

    const { fullName, email, password, role, phoneNumber, address } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and temporary password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();
    const targetRole = (role === 'SuperAdmin' || String(role).toLowerCase() === 'superadmin') ? 'SuperAdmin' : 'Admin';

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedPermissions = targetRole === 'SuperAdmin'
      ? {
          manageComplaints: true,
          manageEmergencies: true,
          manageUsers: true,
          manageInquiries: true,
          viewReports: true,
          manageSettings: true,
          viewAuditLogs: true,
          viewSecurityMetadata: true,
          manageAdministrators: true
        }
      : { ...DEFAULT_ADMIN_PERMISSIONS };

    if (global.useMockData) {
      const existingUser = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }

      const newAdmin = {
        id: `admin-${Date.now()}`,
        fullName: cleanName,
        email: cleanEmail,
        phoneNumber: phoneNumber ? String(phoneNumber).trim() : '0000000000',
        nationalId: 'ADMIN-STAFF',
        address: address || { no: 'HQ', street: 'Police HQ', city: 'Colombo', district: 'Colombo' },
        password: hashedPassword,
        role: targetRole,
        permissions: assignedPermissions,
        mustChangePassword: true,
        isActive: true,
        citizenId: `CIW-ADMIN-${String(mockUsers.filter(u => u.role === 'Admin' || u.role === 'SuperAdmin').length + 1).padStart(4, '0')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockUsers.unshift(newAdmin);

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: 'SuperAdmin',
        action: 'ADMIN_CREATED',
        entityType: 'User',
        entityId: newAdmin.id,
        metadata: { newAdminEmail: cleanEmail, assignedRole: targetRole }
      });

      return res.status(201).json({
        message: `${targetRole} created successfully`,
        admin: {
          id: newAdmin.citizenId,
          dbId: newAdmin.id,
          name: newAdmin.fullName,
          email: newAdmin.email,
          role: newAdmin.role,
          isActive: newAdmin.isActive
        }
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Sequence calculation ensuring monotonic uniqueness across deletions
    let nextSeq = (await User.countDocuments({ role: { $in: ['Admin', 'SuperAdmin'] } })) + 1;
    const existingAdmins = await User.find({ citizenId: { $regex: '^CIW-ADMIN-' } }, { citizenId: 1 }).lean();
    if (existingAdmins && existingAdmins.length > 0) {
      let maxNum = 0;
      for (const a of existingAdmins) {
        if (a.citizenId) {
          const parts = a.citizenId.split('-');
          const lastNum = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastNum) && lastNum > maxNum) {
            maxNum = lastNum;
          }
        }
      }
      if (maxNum >= nextSeq) {
        nextSeq = maxNum + 1;
      }
    }

    let citizenId = `CIW-ADMIN-${String(nextSeq).padStart(4, '0')}`;
    while (await User.exists({ citizenId })) {
      nextSeq += 1;
      citizenId = `CIW-ADMIN-${String(nextSeq).padStart(4, '0')}`;
    }

    const newAdmin = new User({
      fullName: cleanName,
      email: cleanEmail,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : '0000000000',
      nationalId: 'ADMIN-STAFF',
      address: address || { no: 'HQ', street: 'Police HQ', city: 'Colombo', district: 'Colombo' },
      password: hashedPassword,
      role: targetRole,
      permissions: assignedPermissions,
      mustChangePassword: true,
      isActive: true,
      citizenId
    });

    await newAdmin.save();

    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'SuperAdmin',
      action: 'ADMIN_CREATED',
      entityType: 'User',
      entityId: String(newAdmin._id),
      metadata: { newAdminEmail: cleanEmail, assignedRole: targetRole }
    });

    res.status(201).json({
      message: `${targetRole} created successfully`,
      admin: {
        id: newAdmin.citizenId,
        dbId: String(newAdmin._id),
        name: newAdmin.fullName,
        email: newAdmin.email,
        role: newAdmin.role,
        isActive: newAdmin.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================================
// 5. PROMOTE USER (Citizen -> Admin, or Admin -> SuperAdmin)
// ============================================================
const promoteUser = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden. SuperAdmin only.' });
    }

    const { targetRole } = req.body;
    const targetId = req.params.id;

    if (global.useMockData) {
      const user = mockUsers.find(u => u.id === targetId || u._id === targetId || u.citizenId === targetId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      let newRole = targetRole;
      if (!newRole) {
        newRole = user.role === 'Citizen' ? 'Admin' : (user.role === 'Admin' ? 'SuperAdmin' : user.role);
      }

      if (user.role === 'SuperAdmin') {
        return res.status(400).json({ message: 'User is already a SuperAdmin.' });
      }

      user.role = newRole;
      if (newRole === 'Admin' && !user.permissions) {
        user.permissions = { ...DEFAULT_ADMIN_PERMISSIONS };
      }

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: 'SuperAdmin',
        action: 'ADMIN_PROMOTED',
        entityType: 'User',
        entityId: user.id,
        metadata: { targetEmail: user.email, previousRole: user.role, newRole }
      });

      return res.json({ message: `User promoted to ${newRole} successfully`, role: newRole });
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(targetId);
    const user = await User.findOne({
      $or: [
        ...(isObjId ? [{ _id: targetId }] : []),
        { citizenId: targetId }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    let newRole = targetRole;
    if (!newRole) {
      newRole = user.role === 'Citizen' ? 'Admin' : (user.role === 'Admin' ? 'SuperAdmin' : user.role);
    }

    if (user.role === 'SuperAdmin') {
      return res.status(400).json({ message: 'User is already a SuperAdmin.' });
    }

    const previousRole = user.role;
    user.role = newRole;
    if (newRole === 'Admin' && (!user.permissions || Object.keys(user.permissions).length === 0)) {
      user.permissions = { ...DEFAULT_ADMIN_PERMISSIONS };
    }

    await user.save();

    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'SuperAdmin',
      action: 'ADMIN_PROMOTED',
      entityType: 'User',
      entityId: String(user._id),
      metadata: { targetEmail: user.email, previousRole, newRole }
    });

    res.json({ message: `User promoted to ${newRole} successfully`, role: newRole });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================================
// 6. DEMOTE USER (SuperAdmin -> Admin, or Admin -> Citizen)
// ============================================================
const demoteUser = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden. SuperAdmin only.' });
    }

    const { targetRole } = req.body;
    const targetId = req.params.id;

    if (global.useMockData) {
      const user = mockUsers.find(u => u.id === targetId || u._id === targetId || u.citizenId === targetId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Check self-demotion if last SuperAdmin
      if (user.role === 'SuperAdmin') {
        const otherActiveSuperAdmins = mockUsers.filter(u => u.role === 'SuperAdmin' && u.isActive !== false && u.id !== user.id);
        if (otherActiveSuperAdmins.length < 1) {
          return res.status(409).json({
            message: 'Cannot demote the last active SuperAdmin. At least one active SuperAdmin must always remain in the system.'
          });
        }
      }

      let newRole = targetRole;
      if (!newRole) {
        newRole = user.role === 'SuperAdmin' ? 'Admin' : (user.role === 'Admin' ? 'Citizen' : user.role);
      }

      if (user.role === 'Citizen') {
        return res.status(400).json({ message: 'Citizen cannot be demoted further.' });
      }

      const previousRole = user.role;
      user.role = newRole;
      if (newRole === 'Citizen') {
        user.permissions = undefined;
      }

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: 'SuperAdmin',
        action: 'ADMIN_DEMOTED',
        entityType: 'User',
        entityId: user.id,
        metadata: { targetEmail: user.email, previousRole, newRole }
      });

      return res.json({ message: `User demoted to ${newRole} successfully`, role: newRole });
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(targetId);
    const user = await User.findOne({
      $or: [
        ...(isObjId ? [{ _id: targetId }] : []),
        { citizenId: targetId }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Last SuperAdmin Guard
    if (user.role === 'SuperAdmin') {
      const otherActiveSuperAdmins = await User.countDocuments({
        role: 'SuperAdmin',
        isActive: true,
        _id: { $ne: user._id }
      });

      if (otherActiveSuperAdmins < 1) {
        return res.status(409).json({
          message: 'Cannot demote the last active SuperAdmin. At least one active SuperAdmin must always remain in the system.'
        });
      }
    }

    let newRole = targetRole;
    if (!newRole) {
      newRole = user.role === 'SuperAdmin' ? 'Admin' : (user.role === 'Admin' ? 'Citizen' : user.role);
    }

    if (user.role === 'Citizen') {
      return res.status(400).json({ message: 'Citizen cannot be demoted further.' });
    }

    const previousRole = user.role;
    user.role = newRole;
    if (newRole === 'Citizen') {
      user.permissions = undefined;
    }

    await user.save();

    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'SuperAdmin',
      action: 'ADMIN_DEMOTED',
      entityType: 'User',
      entityId: String(user._id),
      metadata: { targetEmail: user.email, previousRole, newRole }
    });

    res.json({ message: `User demoted to ${newRole} successfully`, role: newRole });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================================
// 7. UPDATE ADMIN PERMISSIONS (SuperAdmin Only)
// ============================================================
const updateAdminPermissions = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden. SuperAdmin only.' });
    }

    const { permissions } = req.body;
    const targetId = req.params.id;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ message: 'Valid permissions object is required.' });
    }

    if (global.useMockData) {
      const user = mockUsers.find(u => u.id === targetId || u._id === targetId || u.citizenId === targetId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.role === 'SuperAdmin') {
        return res.status(400).json({
          message: 'SuperAdmin accounts inherently retain full system permissions and cannot be restricted.'
        });
      }

      user.permissions = {
        ...DEFAULT_ADMIN_PERMISSIONS,
        ...(user.permissions || {}),
        ...permissions
      };

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: 'SuperAdmin',
        action: 'ADMIN_PERMISSIONS_UPDATED',
        entityType: 'User',
        entityId: user.id,
        metadata: { targetEmail: user.email, updatedPermissions: user.permissions }
      });

      return res.json({ message: 'Permissions updated successfully', permissions: user.permissions });
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(targetId);
    const user = await User.findOne({
      $or: [
        ...(isObjId ? [{ _id: targetId }] : []),
        { citizenId: targetId }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'SuperAdmin') {
      return res.status(400).json({
        message: 'SuperAdmin accounts inherently retain full system permissions and cannot be restricted.'
      });
    }

    const currentPerms = (user.permissions && typeof user.permissions === 'object')
      ? (user.permissions.toObject ? user.permissions.toObject() : user.permissions)
      : { ...DEFAULT_ADMIN_PERMISSIONS };

    user.permissions = {
      ...currentPerms,
      ...permissions
    };

    await user.save();

    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'SuperAdmin',
      action: 'ADMIN_PERMISSIONS_UPDATED',
      entityType: 'User',
      entityId: String(user._id),
      metadata: { targetEmail: user.email, updatedPermissions: user.permissions }
    });

    res.json({ message: 'Permissions updated successfully', permissions: user.permissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================================
// 8. DEACTIVATE USER (Soft Suspension)
// ============================================================
const deactivateUser = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    const targetId = req.params.id;

    if (global.useMockData) {
      const user = mockUsers.find(u => u.id === targetId || u._id === targetId || u.citizenId === targetId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.role === 'Admin' && !isSuperAdmin) {
        return res.status(403).json({ message: 'Normal Admin cannot deactivate Admin accounts.' });
      }
      if (user.role === 'SuperAdmin' && !isSuperAdmin) {
        return res.status(403).json({ message: 'Forbidden. Normal Admin cannot modify SuperAdmin accounts.' });
      }

      if (user.role === 'SuperAdmin') {
        const otherActive = mockUsers.filter(u => u.role === 'SuperAdmin' && u.isActive !== false && u.id !== user.id);
        if (otherActive.length < 1) {
          return res.status(409).json({
            message: 'Cannot deactivate the last active SuperAdmin. At least one active SuperAdmin must always remain in the system.'
          });
        }
      }

      user.isActive = false;
      user.deletedAt = new Date().toISOString();

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: user.id,
        metadata: { targetEmail: user.email, targetRole: user.role }
      });

      return res.json({ message: 'User account deactivated successfully' });
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(targetId);
    const user = await User.findOne({
      $or: [
        ...(isObjId ? [{ _id: targetId }] : []),
        { citizenId: targetId }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'Admin' && !isSuperAdmin) {
      return res.status(403).json({ message: 'Normal Admin cannot deactivate Admin accounts.' });
    }
    if (user.role === 'SuperAdmin' && !isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden. Normal Admin cannot modify SuperAdmin accounts.' });
    }

    if (user.role === 'SuperAdmin') {
      const otherActive = await User.countDocuments({
        role: 'SuperAdmin',
        isActive: true,
        _id: { $ne: user._id }
      });

      if (otherActive < 1) {
        return res.status(409).json({
          message: 'Cannot deactivate the last active SuperAdmin. At least one active SuperAdmin must always remain in the system.'
        });
      }
    }

    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: String(user._id),
      metadata: { targetEmail: user.email, targetRole: user.role }
    });

    res.json({ message: 'User account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================================
// 9. REACTIVATE USER
// ============================================================
const reactivateUser = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    const targetId = req.params.id;

    if (global.useMockData) {
      const user = mockUsers.find(u => u.id === targetId || u._id === targetId || u.citizenId === targetId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if ((user.role === 'Admin' || user.role === 'SuperAdmin') && !isSuperAdmin) {
        return res.status(403).json({ message: 'Normal Admin cannot reactivate Administrator accounts.' });
      }

      user.isActive = true;
      user.deletedAt = null;

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'USER_REACTIVATED',
        entityType: 'User',
        entityId: user.id,
        metadata: { targetEmail: user.email, targetRole: user.role }
      });

      return res.json({ message: 'User account reactivated successfully' });
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(targetId);
    const user = await User.findOne({
      $or: [
        ...(isObjId ? [{ _id: targetId }] : []),
        { citizenId: targetId }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if ((user.role === 'Admin' || user.role === 'SuperAdmin') && !isSuperAdmin) {
      return res.status(403).json({ message: 'Normal Admin cannot reactivate Administrator accounts.' });
    }

    user.isActive = true;
    user.deletedAt = null;
    await user.save();

    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'USER_REACTIVATED',
      entityType: 'User',
      entityId: String(user._id),
      metadata: { targetEmail: user.email, targetRole: user.role }
    });

    res.json({ message: 'User account reactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================================
// 10. PERMANENT DELETE USER (True Cascade Delete)
// ============================================================
const permanentDeleteUser = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    const targetId = req.params.id;

    if (global.useMockData) {
      const userIndex = mockUsers.findIndex(u => u.id === targetId || u._id === targetId || u.citizenId === targetId);
      if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

      const targetUser = mockUsers[userIndex];

      // Self-delete guard
      if (String(req.user.id) === String(targetUser.id)) {
        return res.status(400).json({ message: 'Cannot delete your own account.' });
      }

      // Normal Admin cannot delete Admin or SuperAdmin
      if ((targetUser.role === 'Admin' || targetUser.role === 'SuperAdmin') && !isSuperAdmin) {
        return res.status(403).json({ message: 'Normal Admin cannot delete Administrator accounts.' });
      }

      // Last SuperAdmin Guard
      if (targetUser.role === 'SuperAdmin') {
        const otherActive = mockUsers.filter(u => u.role === 'SuperAdmin' && u.isActive !== false && u.id !== targetUser.id);
        if (otherActive.length < 1) {
          return res.status(409).json({
            message: 'Cannot delete the last active SuperAdmin. At least one active SuperAdmin must always remain in the system.'
          });
        }
      }

      // Find all complaints owned by user
      const ownedComplaints = mockComplaints.filter(c => c.userId === targetUser.id);
      const complaintsCount = ownedComplaints.length;

      // Collect evidence files
      const evidenceFiles = [];
      ownedComplaints.forEach(c => {
        if (Array.isArray(c.evidenceFiles)) {
          c.evidenceFiles.forEach(f => { if (f) evidenceFiles.push(f); });
        }
      });

      // Delete evidence files
      const filesDeletedCount = cleanupEvidenceFiles(evidenceFiles);

      // Remove complaints from mockComplaints
      for (let i = mockComplaints.length - 1; i >= 0; i--) {
        if (mockComplaints[i].userId === targetUser.id) {
          mockComplaints.splice(i, 1);
        }
      }

      // Remove user from mockUsers
      mockUsers.splice(userIndex, 1);

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'USER_PERMANENTLY_DELETED',
        entityType: 'User',
        entityId: targetUser.id,
        metadata: {
          targetEmail: targetUser.email,
          targetRole: targetUser.role,
          complaintsDeleted: complaintsCount,
          evidenceFilesDeleted: filesDeletedCount
        }
      });

      return res.json({
        message: 'User permanently deleted',
        deletedUserId: targetUser.id,
        complaintsDeleted: complaintsCount,
        evidenceFilesDeleted: filesDeletedCount
      });
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(targetId);
    const targetUser = await User.findOne({
      $or: [
        ...(isObjId ? [{ _id: targetId }] : []),
        { citizenId: targetId }
      ]
    });

    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Self-delete guard
    if (String(req.user.id) === String(targetUser._id)) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }

    // Normal Admin cannot delete Admin or SuperAdmin
    if ((targetUser.role === 'Admin' || targetUser.role === 'SuperAdmin') && !isSuperAdmin) {
      return res.status(403).json({ message: 'Normal Admin cannot delete Administrator accounts.' });
    }

    // Last SuperAdmin Guard
    if (targetUser.role === 'SuperAdmin') {
      const otherActive = await User.countDocuments({
        role: 'SuperAdmin',
        isActive: true,
        _id: { $ne: targetUser._id }
      });

      if (otherActive < 1) {
        return res.status(409).json({
          message: 'Cannot delete the last active SuperAdmin. At least one active SuperAdmin must always remain in the system.'
        });
      }
    }

    // Find all complaints owned by target user (including authenticated anonymous complaints)
    const complaints = await Complaint.find({ user: targetUser._id });
    const complaintsCount = complaints.length;

    // Collect all evidence filenames
    const evidenceFiles = [];
    complaints.forEach(c => {
      if (Array.isArray(c.evidenceFiles)) {
        c.evidenceFiles.forEach(f => {
          if (f) evidenceFiles.push(f);
        });
      }
    });

    // 1. Delete complaints from DB
    await Complaint.deleteMany({ user: targetUser._id });

    // 2. Delete user from DB
    await User.findByIdAndDelete(targetUser._id);

    // 3. Delete physical evidence files safely
    const filesDeletedCount = cleanupEvidenceFiles(evidenceFiles);

    // 4. Record permanent deletion in audit log
    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'USER_PERMANENTLY_DELETED',
      entityType: 'User',
      entityId: String(targetUser._id),
      metadata: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        complaintsDeleted: complaintsCount,
        evidenceFilesDeleted: filesDeletedCount
      }
    });

    res.json({
      message: 'User permanently deleted',
      deletedUserId: String(targetUser._id),
      complaintsDeleted: complaintsCount,
      evidenceFilesDeleted: filesDeletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Backward-compatible soft-delete alias
const deleteUser = deactivateUser;
const promoteUserToAdmin = promoteUser;

module.exports = {
  getAllUsers,
  getAllAdmins,
  getUserCount,
  createAdmin,
  promoteUser,
  demoteUser,
  updateAdminPermissions,
  deactivateUser,
  reactivateUser,
  permanentDeleteUser,
  deleteUser,
  promoteUserToAdmin
};
