const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  inventory: {
    cobblestone: { type: Number, default: 0 },
    coal: { type: Number, default: 0 },
    iron: { type: Number, default: 0 },
    diamond: { type: Number, default: 0 },
    emerald: { type: Number, default: 0 }
  },
  pickaxeLevel: { type: Number, default: 1 },
  hasLuckyCharm: { type: Boolean, default: false },
  boostExpires: { type: Date, default: null },
  lastMine: { type: Date, default: null },
});

module.exports = mongoose.model('User', userSchema);
