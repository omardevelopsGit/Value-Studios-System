// Handler
process.on('uncaughtException', (e) => {
  console.log('UNCAUGHT  EXCEPTION');
  console.log(e);
  process.exit();
});

process.on('unhandledRejection', (e) => {
  console.log('UNCAUGHT  REJECTION');
  console.log(e);
});

// Setting up process data
const processData = require('./utils/processData.js');
processData.set('joinToCreateRoom', '1201133233098735636');
processData.set('ticketTypes', ['ban', 'mod', 'pro']);
processData.set('allowedTicketRoles', [
  '1145704443858391161',
  '1145704445158625360',
]);
processData.set('everyoneRole', '1145096746297466931');
processData.set('allowedToAddRoles_ticket', ['1145704445158625360']);
processData.set('allowedToAddRoles_mod', [
  '1145704434601570344',
  '1145704421615992922',
]);
processData.set('allowedToRemoveRoles_ticket', ['1145704445158625360']);
processData.set('allowedToRemoveRoles_mod', [
  '1145704434601570344',
  '1145704421615992922',
]);
processData.set('modRoleId', '1145704433087418419');
processData.set('crewRoleId', '1199443998830514227');
processData.set('ticketRoleId', '1145704443858391161');
processData.set('suggestionRoomId', '1198953606313934919');
processData.set('checker', (inputString) => {
  const words = [
    // كل هذه الكلمات هنا لكي حذف من السيرفر في حال تم ارسالها
    ' طيز ',
    ' كس ',
    ' زب ',
    ' مكوه ',
    ' مكوة ',
    ' مكوته ',
    ' نيك ',
    ' مكوتها ',
    'كس ام',
    'كس اخت',
    'نيك ام',
    'نيك اخت',
    'يلعن ربك',
    'يلعن دينك',
    'يلعن الكعبه',
    'يلعن المصحف',
    'يلعن الرسول',
    'يلعن النبي',
    'يلعن محمد',
    ' بز ',
    ' زبي ',
    ' كسي ',
    'تلحس زب',
    'تلحسي زب',
    'تلحسي طيز',
    'تلحس طيز',
    'تلحسي كس',
    'تلحس كس',
    'يلعن امك',
    'يلعن ابوك',
    'يلعن اختك',
    'يلعن اخوك',
  ]; // All of these words is here to be deleted if sent on the server

  // Check if the string contains forbidden words
  for (const word of words) {
    if (inputString.includes(word)) {
      return true;
    }
  }
  return false;
});

// Requiring modules
require('dotenv').config();
const client = require('./utils/discordClient.js');
const ticketSystem = require('./systems/ticketSystem.js');
const errorSystem = require('./systems/errorSystem.js');
const announceSystem = require('./systems/announceSystem.js');
const joinToCreateSystem = require('./systems/joinToCreateSystem.js');
const privateChatSystem = require('./systems/privateChatSystem.js');
const commandSystem = require('./systems/commandSystem.js');
const suggestionSystem = require('./systems/suggestionSystem.js');
const voiceSystem = require('./systems/voiceSystem.js');
const mongoose = require('mongoose');
const express = require('express');
const { EmbedBuilder } = require('discord.js');

const app = express();

// DB
mongoose
  .connect(process.env.DB_URL)
  .then((connection) => {
    console.log('Successfully connected to the database');
    processData.set('db', connection);
  })
  .catch((e) => {
    console.log('Could not connect to the database');
    console.log(e.message);
    console.log(e.stack);
  });

// Handles
client.on('ready', async () => {
  console.log(`Bot is logged in as: ${client.user.tag} | ${client.user.id}`);
  const guild = await client.guilds.fetch(process.env.GUILD);
});

client.on('messageCreate', async (msg) => {
  if (processData.get('checker')(msg.content)) {
    const dm = await msg.author.createDM(true);
    await dm.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('تم حذف رسالتك')
          .setAuthor({
            iconURL: msg.author.avatarURL(),
            name: msg.author.displayName,
          })
          .setColor('Red').setDescription(`
            تم حذف رسالتك\n
            ${msg.content}\n
            بسبب إحتوائها على كلمات نابيه\n
        `),
      ],
    });

    return await msg.delete();
  }

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

// Keeping the web service up
setInterval(async () => {
  try {
    await fetch(process.env.LIVE_API);
    // console.log('Done a request on me!');
  } catch (e) {}
}, 60000 * 3);
