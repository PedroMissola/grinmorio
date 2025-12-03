const express = require('express');
const router = express.Router();
const { recordStat } = require('../controllers/stats');

// All routes are prefixed with /api/stats

// POST /api/stats/record
router.post('/record', recordStat);

module.exports = router;
