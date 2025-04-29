const mongoose = require('mongoose');

const xpSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
});

module.exports = mongoose.model('XP', xpSchema);  // This should match the import
