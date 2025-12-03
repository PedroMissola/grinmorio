const express = require('express');
const router = express.Router();
const {
  getUserStatus,
  banUser,
  unbanUser,
  listBannedUsers,
} = require('../controllers/users');
// const { authenticateToken, authorizeRole } = require('../middleware/auth'); // Add later if needed

// All routes in this file will be prefixed with /api/usuarios

// GET /api/usuarios/list
router.get('/list', listBannedUsers);

// GET /api/usuarios/:userId/status
router.get('/:userId/status', getUserStatus);

// POST /api/usuarios/ban
// Maybe this should be protected by auth in the future
router.post('/ban', banUser);

// POST /api/usuarios/unban
router.post('/unban', unbanUser);

module.exports = router;
