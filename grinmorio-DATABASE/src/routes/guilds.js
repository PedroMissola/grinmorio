const express = require('express');
const router = express.Router();
const { getGuildSettings, updateGuildSettings } = require('../controllers/guilds');
// const { authenticateToken } = require('../middleware/auth'); // Add later if needed

// All routes in this file will be prefixed with /api/guilds

// GET /api/guilds/:guildId/settings
router.get('/:guildId/settings', getGuildSettings);

// PUT /api/guilds/:guildId/settings
router.put('/:guildId/settings', updateGuildSettings);

module.exports = router;
