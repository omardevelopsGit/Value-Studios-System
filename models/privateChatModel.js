const mongoose = require('mongoose');

const privateChatSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  discordId: {
    type: String,
    requried: true,
  },
  owner: {
    type: 'String',
    required: [true, 'Please provide the owner'],
  },
  members: [String],
  status: {
    type: String,
    enum: [
      'down', // No mods are monitoring
      'active',
      'closed', // Have been totally closed
    ],
    default: 'down',
  },
  mod: {
    type: String,
    default: 'ua',
  },
  mods: [
    {
      discordId: { type: String, default: 'ua' },
      addedAt: Date,
      operation: {
        type: String,
        enum: ['join', 'left'],
      },
    },
  ],
  closedAt: {
    type: Date,
  },
});

const PrivateChat = mongoose.model('PrivateChat', privateChatSchema);

module.exports = PrivateChat;
