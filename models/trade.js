const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  recipientId: { type: String, required: true },
  itemsTraded: [{ item: String, quantity: Number }],
  coinsTraded: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Trade', tradeSchema);
