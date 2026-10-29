const express = require('express');
const router = express.Router();
const { getAllUsers, getAllAdmins, getUserCount, deleteUser, promoteUserToAdmin } = require('../controllers/userController');
const { authMiddleware, adminMiddleware, superAdminMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, adminMiddleware, getAllUsers);
router.get('/all', authMiddleware, adminMiddleware, getAllUsers);
router.get('/admins', authMiddleware, superAdminMiddleware, getAllAdmins);
router.get('/count', authMiddleware, adminMiddleware, getUserCount);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);
router.put('/:id/promote', authMiddleware, superAdminMiddleware, promoteUserToAdmin);

module.exports = router;
