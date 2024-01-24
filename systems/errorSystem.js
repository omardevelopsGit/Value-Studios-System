const { EmbedBuilder } = require('discord.js');
const Room = require('../models/roomsModel.js');
const client = require('../utils/discordClient.js');
const publicEventEmitter = require('../utils/multiEventEmitter.js');
const catchAsync = require('../utils/catchAsync.js');

let errorChannelId;

const fillChannelId = async () => {
  const room = await Room.findOne({ role: 'error-system' });

  if (room) errorChannelId = room.discordId;
  else errorChannelId = undefined;
};

fillChannelId();

client.on(
  'messageCreate',
  catchAsync(async (msg) => {
    if (msg.content === '-error-logs') {
      const queryObject = {
        discordId: errorChannelId,
        role: 'error-system',
      };
      if (errorChannelId) delete queryObject.role;
      else delete queryObject.discordId;

      let room = await Room.findOne(queryObject);

      if (!room) room = new Room({ role: 'error-system' });

      room.discordId = msg.channelId;

      await room.save();

      const embed = new EmbedBuilder()
        .setDescription('هذا الروم سيتم استخدامه لإظهار الأخطاء')
        .setTitle('نجاح')
        .setColor('Green');

      msg.channel.send({ embeds: [embed] });
    }
  })
);

publicEventEmitter.on('error', async (e) => {
  if (errorChannelId) {
    const guild = await client.guilds.fetch(process.env.GUILD);
    const errorChannel = await guild.channels.fetch(errorChannelId);

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Value Studios System' })
      .setColor('#e03131')
      .setTitle('حدث خطأ').setDescription(`
       This is value studios system, this embed is written because of error:\n
       Message: ${e.message}\n\n

       حصل هذا في: ${Intl.DateTimeFormat('ar-SY', {
         hour: '2-digit',
         minute: '2-digit',
         day: '2-digit',
         weekday: 'long',
         year: 'numeric',
         month: 'long',
       }).format(new Date())}
      `);

    errorChannel.send({ embeds: [embed] });
  }
});
