const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug', 'event', 'cmd'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: { createdAt: 'timestamp' },
  // Capped collection to prevent infinite growth
  // capped: { size: 1024 * 1024 * 50, max: 50000 }, 
});

logSchema.index({ level: 1 });
logSchema.index({ timestamp: -1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
