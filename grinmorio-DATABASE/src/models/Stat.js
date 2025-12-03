const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    index: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: { createdAt: 'timestamp' },
});

statSchema.index({ event: 1, timestamp: -1 });

const Stat = mongoose.model('Stat', statSchema);

module.exports = Stat;
