const express = require('express');
const router = express.Router();
const { createLog } = require('../controllers/logs');

// All routes are prefixed with /api/logs

// POST /api/logs
router.post('/', createLog);

module.exports = router;
