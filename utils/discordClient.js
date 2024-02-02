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
client.login(process.env.BOT_TOKEN).catch((e) => {
  console.log('Could not log in to the bot');
  console.log(e);
});

module.exports = client;
