const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  banReason: {
    type: String,
    default: null,
  },
  bannedAt: {
    type: Date,
    default: null,
  },
  // We can add other user-specific settings here in the future
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
