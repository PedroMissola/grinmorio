const Stat = require('../models/Stat');
const { sendErrorResponse } = require('../utils/herrorHandler');

/**
 * Records a new stat/event entry.
 */
async function recordStat(req, res) {
  const { event, details } = req.body;

  if (!event) {
    return sendErrorResponse(res, 400, 'Bad Request', 'Event name is required.');
  }

  try {
    const statEntry = new Stat({
      event,
      details: details || {},
    });

    await statEntry.save();
    res.status(201).json({ message: 'Stat recorded successfully.' });
  } catch (error) {
    console.error('Error recording stat:', error);
    sendErrorResponse(res, 500, 'Internal Server Error', 'Could not record stat.');
  }
}

module.exports = {
  recordStat,
};
