const jwt = require('jsonwebtoken');

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
      req.user = {
        ...decoded,
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email
      };
    } else {
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('role isActive fullName email');
      if (!user) {
        return res.status(401).json({ message: 'User account no longer exists.' });
      }
      if (user.isActive === false) {
        return res.status(403).json({ message: 'Account has been deactivated. Please contact administration.' });
      }
      req.user = {
        ...decoded,
        id: String(user._id),
        role: user.role,
        fullName: user.fullName,
        email: user.email
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

module.exports = { authMiddleware, adminMiddleware, superAdminMiddleware };
