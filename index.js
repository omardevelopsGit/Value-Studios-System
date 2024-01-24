require('dotenv').config();
const client = require('./utils/discordClient.js');
const ticketSystem = require('./systems/ticketSystem.js');
const errorSystem = require('./systems/errorSystem.js');
const announceSystem = require('./systems/announceSystem.js');
const commandSystem = require('./systems/commandSystem.js');
const mongoose = require('mongoose');
const express = require('express');

const app = express();

// DB
mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log('Successfully connected to the database');
  })
  .catch((e) => {
    console.log('Could not connect to the database');
    console.log(e.message);
    console.log(e.stack);
  });

// Handles
client.on('ready', async () => {
  console.log(`Bot is logged in as: ${client.user.tag} | ${client.user.id}`);
});

client.on('messageCreate', async (msg) => {
  if (!msg.guild || msg.author.bot) return; // Ignore DM

  if (msg.content === '-ticket')
    ticketSystem.updateTicketChannel(msg.channelId, client);
  if (msg.content.startsWith('-ticket-dir'))
    ticketSystem.setCategory(msg.channel, client, msg.content.split(' ')[1]);
  if (msg.content.startsWith('-ticket-close-dir'))
    ticketSystem.setClosedCategory(msg.channel);
});

client.on('interactionCreate', (interaction) => {
  let reply = undefined;
  let executed = false;
  if (
    interaction.isButton() &&
    interaction.customId.startsWith('start-') &&
    interaction.customId.endsWith('-ticket')
  ) {
    reply = ticketSystem.createTicket(
      interaction,
      interaction.customId.split('-')[1],
      client
    );
    executed = true;
  } else if (
    interaction.isButton() &&
    interaction.customId.startsWith('close-ticket')
  ) {
    reply = ticketSystem.closeTicket(
      interaction.channel,
      interaction.customId.split('-')[2],
      client,
      interaction
    );
    executed = true;
  }

  if (executed)
    interaction.reply({
      ephemeral: true,
      content: reply || 'شكرا!',
    });
});

// Express
app.all('*', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Sorry, Value studios have no website for now',
  });
});

app.listen(process.env.PORT, () => {
  console.log(`App is running on port ${process.env.PORT}`);
});
