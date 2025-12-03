const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  guildName: {
    type: String,
    required: true,
  },
  prefix: {
    type: String,
    default: '!',
  },
  memberCount: {
    type: Number,
    default: 0,
  },
  leftAt: {
    type: Date,
    default: null,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Guild = mongoose.model('Guild', guildSchema);

module.exports = Guild;
