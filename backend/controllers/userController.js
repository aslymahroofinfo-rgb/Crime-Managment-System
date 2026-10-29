const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { mockUsers, mockComplaints } = require('../mockData');
const { logAudit } = require('../services/auditService');

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
        dbId: user._id,
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        nid: user.nationalId,
        isActive: user.isActive !== false,
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
        address: typeof user.address === 'object' && user.address !== null
          ? `${user.address.no || ''}, ${user.address.street || ''}, ${user.address.city || ''}, ${user.address.district || ''}`
          : user.address || 'N/A',
        cases: 0,
        role: user.role
      }));

      return res.json(adminsMapped);
    }

    const admins = await User.find({ role: { $in: ['Admin', 'SuperAdmin'] } }).select('-password');
    const adminsMapped = admins.map(user => ({
      id: user.citizenId || `CIW-ADMIN-${user._id.toString().slice(-4).toUpperCase()}`,
      dbId: user._id,
      name: user.fullName,
      email: user.email,
      phone: user.phoneNumber,
      nid: user.nationalId || 'N/A',
      isActive: user.isActive !== false,
      address: typeof user.address === 'object' && user.address !== null
        ? `${user.address.no || ''}, ${user.address.street || ''}, ${user.address.city || ''}, ${user.address.district || ''}`
        : user.address || 'N/A',
      cases: 0,
      role: user.role
    }));
    res.json(adminsMapped);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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

const deleteUser = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    const targetId = req.params.id;

    // Self-deletion check
    if (req.user && (req.user.id === targetId || String(req.user.id) === String(targetId))) {
      return res.status(400).json({ message: 'Cannot delete or deactivate your own account.' });
    }

    if (global.useMockData) {
      const targetUser = mockUsers.find((user) => user.id === targetId || user._id === targetId);
      if (!targetUser) return res.status(404).json({ message: 'User not found' });

      // SuperAdmin protection
      if (targetUser.role === 'SuperAdmin') {
        return res.status(403).json({ message: 'SuperAdmin account cannot be deleted or deactivated.' });
      }

      // Admin modification authorization
      if (targetUser.role === 'Admin' && !isSuperAdmin) {
        return res.status(403).json({ message: 'Only SuperAdmin can deactivate Admin accounts' });
      }

      // Soft-deactivate to maintain referential integrity of past complaints
      targetUser.isActive = false;
      targetUser.deletedAt = new Date().toISOString();

      await logAudit({
        actor: req.user ? req.user.id : 'Admin',
        actorEmail: req.user ? req.user.email : '',
        actorRole: req.user ? req.user.role : 'Admin',
        action: 'USER_DELETED_OR_DEACTIVATED',
        entityType: 'User',
        entityId: targetUser.id,
        metadata: { targetEmail: targetUser.email, targetRole: targetUser.role, softDeactivated: true }
      });

      return res.json({ message: 'User deactivated successfully' });
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

    // SuperAdmin protection
    if (targetUser.role === 'SuperAdmin') {
      return res.status(403).json({ message: 'SuperAdmin account cannot be deleted or deactivated.' });
    }

    // Admin modification authorization
    if (targetUser.role === 'Admin' && !isSuperAdmin) {
      return res.status(403).json({ message: 'Only SuperAdmin can deactivate Admin accounts' });
    }

    // Soft-deactivate user
    targetUser.isActive = false;
    targetUser.deletedAt = new Date();
    await targetUser.save();

    await logAudit({
      actor: req.user ? req.user.id : 'Admin',
      actorEmail: req.user ? req.user.email : '',
      actorRole: req.user ? req.user.role : 'Admin',
      action: 'USER_DELETED_OR_DEACTIVATED',
      entityType: 'User',
      entityId: String(targetUser._id),
      metadata: { targetEmail: targetUser.email, targetRole: targetUser.role, softDeactivated: true }
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const promoteUserToAdmin = async (req, res) => {
  try {
    const isSuperAdmin = req.user && String(req.user.role).toLowerCase() === 'superadmin';
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden. Only SuperAdmin can grant admin privileges.' });
    }

    if (global.useMockData) {
      const user = mockUsers.find((entry) => entry.id === req.params.id || entry._id === req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.role !== 'Citizen') {
        return res.status(400).json({ message: 'Only citizens can be promoted to Admin.' });
      }

      user.role = 'Admin';

      await logAudit({
        actor: req.user.id,
        actorEmail: req.user.email,
        actorRole: 'SuperAdmin',
        action: 'USER_PROMOTED',
        entityType: 'User',
        entityId: user.id,
        metadata: { promotedUserEmail: user.email, newRole: 'Admin' }
      });

      return res.json({ message: 'User promoted to Admin successfully' });
    }

    const mongoose = require('mongoose');
    const isObjId = mongoose.isValidObjectId(req.params.id);
    const user = await User.findOne({
      $or: [
        ...(isObjId ? [{ _id: req.params.id }] : []),
        { citizenId: req.params.id }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'Citizen') {
      return res.status(400).json({ message: 'Only citizens can be promoted to Admin.' });
    }

    user.role = 'Admin';
    await user.save();

    await logAudit({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'SuperAdmin',
      action: 'USER_PROMOTED',
      entityType: 'User',
      entityId: String(user._id),
      metadata: { promotedUserEmail: user.email, newRole: 'Admin' }
    });

    res.json({ message: 'User promoted to Admin successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAllUsers, getAllAdmins, getUserCount, deleteUser, promoteUserToAdmin };
