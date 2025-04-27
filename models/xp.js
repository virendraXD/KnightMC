const mongoose = require('mongoose');

const xpSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  exp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
});

// Prevent OverwriteModelError
module.exports = mongoose.models.XP || mongoose.model('XP', xpSchema);
