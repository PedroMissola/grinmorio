const Log = require('../models/Log');
const { sendErrorResponse } = require('../utils/herrorHandler');

/**
 * Records a new log entry.
 */
async function createLog(req, res) {
  const { level, message, details } = req.body;

  if (!level || !message) {
    return sendErrorResponse(res, 400, 'Bad Request', 'Log level and message are required.');
  }

  try {
    const logEntry = new Log({
      level,
      message,
      details: details || {},
    });

    await logEntry.save();
    res.status(201).json({ message: 'Log recorded successfully.' });
  } catch (error) {
    console.error('Error recording log:', error);
    sendErrorResponse(res, 500, 'Internal Server Error', 'Could not record log.');
  }
}

module.exports = {
  createLog,
};
