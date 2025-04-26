const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  userId: String,
  name: String,
  species: String,
  level: Number,
  status: String,
});

const Pet = mongoose.model('Pet', petSchema);
module.exports = Pet;
