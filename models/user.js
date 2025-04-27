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
  coins: { type: Number, default: 0 },
  dailyStrike: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  minecoins: { type: Number, default: 0 }, // 💰 New currency field
  pets: { type: Array, default: [], }, // Start with no pets, but can hold multiple
  petSlots: { type: Number, default: 2, }, // Starter users get 2 pet slots
  job: { type: String, default: null },
  jobSince: { type: Date, default: null }
});

module.exports = mongoose.model('User', userSchema);
