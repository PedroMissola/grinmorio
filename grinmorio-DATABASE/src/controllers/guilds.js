const Guild = require('../models/Guild');
const { sendErrorResponse } = require('../utils/herrorHandler');

/**
 * Gets the settings for a specific guild.
 * Creates a default one if it doesn't exist.
 */
async function getGuildSettings(req, res) {
  const { guildId } = req.params;

  if (!guildId) {
    return sendErrorResponse(res, 400, 'Bad Request', 'Guild ID is required.');
  }

  try {
    let guild = await Guild.findOne({ guildId });

    if (!guild) {
      // This part is for safety, but the bot will usually create the settings on join.
      // We assume a 'guildName' might not be available here.
      guild = new Guild({ guildId: guildId, guildName: 'Unknown' });
      await guild.save();
    }

    res.status(200).json(guild);
  } catch (error) {
    console.error(`Error fetching settings for guild ${guildId}:`, error);
    sendErrorResponse(res, 500, 'Internal Server Error', 'Could not retrieve guild settings.');
  }
}

/**
 * Updates the settings for a specific guild.
 * Uses upsert to create the document if it doesn't exist.
 */
async function updateGuildSettings(req, res) {
  const { guildId } = req.params;
  const { settings } = req.body;

  if (!guildId) {
    return sendErrorResponse(res, 400, 'Bad Request', 'Guild ID is required.');
  }
  if (!settings || typeof settings !== 'object') {
    return sendErrorResponse(res, 400, 'Bad Request', 'Settings object is required.');
  }

  // Ensure lastUpdated is always fresh
  settings.lastUpdated = new Date();

  try {
    const updatedGuild = await Guild.findOneAndUpdate(
      { guildId: guildId },
      { $set: settings },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: 'Guild settings updated successfully.',
      guild: updatedGuild,
    });
  } catch (error) {
    console.error(`Error updating settings for guild ${guildId}:`, error);
    sendErrorResponse(res, 500, 'Internal Server Error', 'Could not update guild settings.');
  }
}

module.exports = {
  getGuildSettings,
  updateGuildSettings,
};
