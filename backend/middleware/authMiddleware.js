const jwt = require('jsonwebtoken');

const DEFAULT_ADMIN_PERMISSIONS = {
  manageComplaints: true,
  manageEmergencies: true,
  manageUsers: true,
  manageInquiries: true,
  viewReports: true,
  manageSettings: true,
  viewAuditLogs: false,
  viewSecurityMetadata: false,
  manageAdministrators: false
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up live persisted user to enforce current role and active state
    if (global.useMockData) {
      const { mockUsers } = require('../mockData');
      const user = mockUsers.find(u => u.id === decoded.id || u.email.toLowerCase() === String(decoded.email || '').toLowerCase());
      if (!user) {
        return res.status(401).json({ message: 'User account no longer exists.' });
      }
      if (user.isActive === false) {
        return res.status(403).json({ message: 'Account has been deactivated. Please contact administration.' });
      }

      const userRoleLower = String(user.role || '').toLowerCase();
      const decodedRoleLower = String(decoded.role || '').toLowerCase();
      const authoritativeRole = (userRoleLower === 'superadmin' || decodedRoleLower === 'superadmin')
        ? 'SuperAdmin'
        : (userRoleLower === 'admin' ? 'Admin' : 'Citizen');

      req.user = {
        ...decoded,
        id: user.id,
        role: authoritativeRole,
        fullName: user.fullName,
        email: user.email,
        permissions: user.permissions || { ...DEFAULT_ADMIN_PERMISSIONS }
      };
    } else {
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('role isActive fullName email permissions');
      if (!user) {
        return res.status(401).json({ message: 'User account no longer exists.' });
      }
      if (user.isActive === false) {
        return res.status(403).json({ message: 'Account has been deactivated. Please contact administration.' });
      }

      const userRoleLower = String(user.role || '').toLowerCase();
      const decodedRoleLower = String(decoded.role || '').toLowerCase();
      const authoritativeRole = (userRoleLower === 'superadmin' || decodedRoleLower === 'superadmin')
        ? 'SuperAdmin'
        : (userRoleLower === 'admin' ? 'Admin' : 'Citizen');

      const userPerms = user.permissions && typeof user.permissions === 'object'
        ? (user.permissions.toObject ? user.permissions.toObject() : user.permissions)
        : null;

      req.user = {
        ...decoded,
        id: String(user._id),
        role: authoritativeRole,
        fullName: user.fullName,
        email: user.email,
        permissions: userPerms || { ...DEFAULT_ADMIN_PERMISSIONS }
      };
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  const roleLower = String(req.user.role || '').toLowerCase();
  if (roleLower !== 'admin' && roleLower !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Requires Admin role.' });
  }
  next();
};

const superAdminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  const roleLower = String(req.user.role || '').toLowerCase();
  if (roleLower !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden. Requires SuperAdmin role.' });
  }
  next();
};

const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    const roleLower = String(req.user.role || '').toLowerCase();
    // SuperAdmin inherently bypasses all permission checks
    if (roleLower === 'superadmin') {
      return next();
    }
    // Citizen never has admin permissions
    if (roleLower !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Administrative privileges required.' });
    }
    // For Admin: check permission
    const userPerms = req.user.permissions || {};
    const hasPerm = userPerms[permissionKey] !== undefined 
      ? Boolean(userPerms[permissionKey]) 
      : Boolean(DEFAULT_ADMIN_PERMISSIONS[permissionKey]);

    if (!hasPerm) {
      return res.status(403).json({ 
        message: `Forbidden. You do not have the required permission (${permissionKey}) to perform this action.` 
      });
    }
    next();
  };
};

module.exports = { 
  authMiddleware, 
  adminMiddleware, 
  superAdminMiddleware, 
  requirePermission,
  DEFAULT_ADMIN_PERMISSIONS 
};
