const mongoose = require('mongoose');

const roomsSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
});

const Room = mongoose.model('Room', roomsSchema);

module.exports = Room;
