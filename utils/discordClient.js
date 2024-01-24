require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');

// Ready up client
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
  ],
});

// Logging in
client.login(process.env.BOT_TOKEN);

module.exports = client;
