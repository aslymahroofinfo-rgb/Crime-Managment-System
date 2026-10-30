const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mockUsers, findMockUserByEmail } = require('../mockData');
const { logAudit } = require('../services/auditService');
const { DEFAULT_ADMIN_PERMISSIONS } = require('../middleware/authMiddleware');

const DISTRICTS = {
  'colombo': '1', 'gampaha': '2', 'kalutara': '3', 'kandy': '4', 'matale': '5',
  'nuwara eliya': '6', 'galle': '7', 'matara': '8', 'hambantota': '9', 'jaffna': '10',
  'kilinochchi': '11', 'mannar': '12', 'vavuniya': '13', 'mullaitivu': '14', 'batticaloa': '15',
  'ampara': '16', 'trincomalee': '17', 'kurunegala': '18', 'puttalam': '19', 'anuradhapura': '20',
  'polonnaruwa': '21', 'badulla': '22', 'monaragala': '23', 'ratnapura': '24', 'kegalle': '25'
};

const createToken = (user) => jwt.sign(
  { id: user.id || user._id, role: user.role, email: user.email, fullName: user.fullName },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

const register = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, nationalId, addressNo, street, city, district, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();
    // Protect against mass assignment: Public registration cannot create Admin or SuperAdmin accounts
    const assignedRole = 'Citizen';

    if (global.useMockData) {
      const existingUser = findMockUserByEmail(cleanEmail);
      if (existingUser) return res.status(400).json({ message: 'User already exists' });

      const newUser = {
        id: `citizen-${Date.now()}`,
        fullName: cleanName,
        email: cleanEmail,
        phoneNumber: phoneNumber ? String(phoneNumber).trim() : '',
        nationalId: nationalId ? String(nationalId).trim() : '',
        address: {
          no: addressNo ? String(addressNo).trim() : '',
          street: street ? String(street).trim() : '',
          city: city ? String(city).trim() : '',
          district: district ? String(district).trim() : ''
        },
        password: await bcrypt.hash(password, 10),
        role: assignedRole,
        isActive: true,
        deletedAt: null,
        citizenId: `CIW-USER-${String(mockUsers.filter((u) => u.role === 'Citizen').length + 1).padStart(4, '0')}`
      };

      mockUsers.push(newUser);
      return res.status(201).json({ message: 'User registered successfully' });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let distCode = '0';
    if (district && DISTRICTS[String(district).toLowerCase().trim()]) {
      distCode = DISTRICTS[String(district).toLowerCase().trim()];
    }

    // Sequence calculation ensuring monotonic uniqueness across deletions
    let nextSeq = (await User.countDocuments({ role: 'Citizen' })) + 1;
    const existingCitizens = await User.find({ citizenId: { $regex: '^CIW-USER-' } }, { citizenId: 1 }).lean();
    if (existingCitizens && existingCitizens.length > 0) {
      let maxNum = 0;
      for (const u of existingCitizens) {
        if (u.citizenId) {
          const parts = u.citizenId.split('-');
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

    let citizenId = `CIW-USER-${distCode}-${String(nextSeq).padStart(4, '0')}`;
    while (await User.exists({ citizenId })) {
      nextSeq += 1;
      citizenId = `CIW-USER-${distCode}-${String(nextSeq).padStart(4, '0')}`;
    }

    const address = {
      no: addressNo ? String(addressNo).trim() : '',
      street: street ? String(street).trim() : '',
      city: city ? String(city).trim() : '',
      district: district ? String(district).trim() : ''
    };

    const user = new User({
      fullName: cleanName,
      email: cleanEmail,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : '',
      nationalId: nationalId ? String(nationalId).trim() : '',
      address,
      password: hashedPassword,
      role: assignedRole,
      citizenId,
      isActive: true,
      deletedAt: null
    });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (global.useMockData) {
      const user = findMockUserByEmail(cleanEmail);
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      // Check account active status
      if (user.isActive === false) {
        return res.status(403).json({ message: 'Account has been deactivated. Please contact administration.' });
      }

      if (role) {
        const reqRole = String(role).toLowerCase();
        const userRole = String(user.role).toLowerCase();
        const matches = userRole === reqRole || (reqRole === 'admin' && userRole === 'superadmin');
        if (!matches) {
          return res.status(403).json({ message: `Access denied for role: ${role}` });
        }
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await logAudit({
          actor: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: 'USER_LOGIN_FAILED',
          entityType: 'Auth',
          entityId: user.id,
          metadata: { reason: 'Incorrect password' }
        });
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = createToken(user);

      await logAudit({
        actor: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_LOGIN',
        entityType: 'Auth',
        entityId: user.id,
        metadata: { role: user.role, loginMethod: 'Password' }
      });

      return res.json({
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          permissions: user.permissions || { ...DEFAULT_ADMIN_PERMISSIONS },
          mustChangePassword: Boolean(user.mustChangePassword),
          phoneNumber: user.phoneNumber,
          address: user.address,
          isActive: user.isActive !== false
        }
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check account active status
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account has been deactivated. Please contact administration.' });
    }

    if (role) {
      const reqRole = String(role).toLowerCase();
      const userRole = String(user.role).toLowerCase();
      const matches = userRole === reqRole || (reqRole === 'admin' && userRole === 'superadmin');
      if (!matches) {
        return res.status(403).json({ message: `Access denied for role: ${role}` });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAudit({
        actor: String(user._id),
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_LOGIN_FAILED',
        entityType: 'Auth',
        entityId: String(user._id),
        metadata: { reason: 'Incorrect password' }
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user);

    await logAudit({
      actor: String(user._id),
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'Auth',
      entityId: String(user._id),
      metadata: { role: user.role, loginMethod: 'Password' }
    });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.permissions || { ...DEFAULT_ADMIN_PERMISSIONS },
        mustChangePassword: Boolean(user.mustChangePassword),
        phoneNumber: user.phoneNumber,
        address: user.address,
        isActive: user.isActive !== false
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, addressNo, street, city, district, oldPassword, newPassword } = req.body;

    if (global.useMockData) {
      const user = mockUsers.find((entry) => entry.email === req.user.email || entry.id === req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.isActive === false) {
        return res.status(403).json({ message: 'Account has been deactivated.' });
      }

      if (oldPassword && newPassword) {
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });
        user.password = await bcrypt.hash(newPassword, 10);
      }

      // Strictly allowlist editable fields (prevent role or isActive tampering)
      if (fullName) user.fullName = String(fullName).trim();
      if (phoneNumber) user.phoneNumber = String(phoneNumber).trim();
      if (addressNo && street && city && district) {
        user.address = {
          no: String(addressNo).trim(),
          street: String(street).trim(),
          city: String(city).trim(),
          district: String(district).trim()
        };
      }

      await logAudit({
        actor: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'PROFILE_UPDATED',
        entityType: 'User',
        entityId: user.id,
        metadata: {
          updatedName: Boolean(fullName),
          updatedPhone: Boolean(phoneNumber),
          updatedPassword: Boolean(newPassword)
        }
      });

      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          address: user.address,
          isActive: user.isActive !== false
        }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account has been deactivated.' });
    }

    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (fullName) user.fullName = String(fullName).trim();
    if (phoneNumber) user.phoneNumber = String(phoneNumber).trim();
    if (addressNo && street && city && district) {
      user.address = {
        no: String(addressNo).trim(),
        street: String(street).trim(),
        city: String(city).trim(),
        district: String(district).trim()
      };
    }

    await user.save();

    await logAudit({
      actor: String(user._id),
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: String(user._id),
      metadata: {
        updatedName: Boolean(fullName),
        updatedPhone: Boolean(phoneNumber),
        updatedPassword: Boolean(newPassword)
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        address: user.address,
        isActive: user.isActive !== false
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    if (global.useMockData) {
      const user = mockUsers.find((entry) => entry.email === req.user.email || entry.id === req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      return res.json({
        _id: user.id,
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        address: user.address,
        nationalId: user.nationalId,
        isActive: user.isActive !== false
      });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login, updateProfile, getProfile };
