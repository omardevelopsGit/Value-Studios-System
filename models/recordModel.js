const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  filename: {
    type: String,
    required: true,
    unique: true,
  },
  usersDiscordId: [String],
});

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;
