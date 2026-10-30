const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/userController');
const { authMiddleware, adminMiddleware, superAdminMiddleware, requirePermission } = require('../middleware/authMiddleware');

// Citizen Directory & Counts (Requires manageUsers permission)
router.get('/', authMiddleware, requirePermission('manageUsers'), getAllUsers);
router.get('/all', authMiddleware, requirePermission('manageUsers'), getAllUsers);
router.get('/count', authMiddleware, requirePermission('manageUsers'), getUserCount);

// Administrator Management (SuperAdmin Only)
router.get('/admins', authMiddleware, superAdminMiddleware, getAllAdmins);
router.post('/admins', authMiddleware, superAdminMiddleware, createAdmin);
router.put('/:id/promote', authMiddleware, superAdminMiddleware, promoteUser);
router.put('/:id/demote', authMiddleware, superAdminMiddleware, demoteUser);
router.put('/:id/permissions', authMiddleware, superAdminMiddleware, updateAdminPermissions);

// Account Status Management (Deactivate / Reactivate)
router.put('/:id/deactivate', authMiddleware, requirePermission('manageUsers'), deactivateUser);
router.put('/:id/reactivate', authMiddleware, requirePermission('manageUsers'), reactivateUser);

// User Deletion (Permanent Cascade & Soft-Deactivate fallback)
router.delete('/:id/permanent', authMiddleware, requirePermission('manageUsers'), permanentDeleteUser);
router.delete('/:id', authMiddleware, requirePermission('manageUsers'), deleteUser);

module.exports = router;
