const { EmbedBuilder } = require('discord.js');
const Room = require('../models/roomsModel.js');
const client = require('../utils/discordClient.js');
const catchAsync = require('../utils/catchAsync.js');
const processData = require('../utils/processData.js');

let announceChannelId;
let everyoneRole;

function buildMessage(title, content, message) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Value Media' })
    .setColor('#66d9e8')
    .setTitle(title).setDescription(`
    بسم الله الرحمن الحيم\n\n

    الموضوع | ${content}\n

    \n\n\n\n${message}\n\n\n\n


    وشكرا لكم جميعا.

    إدارة فاليو.
  `);

  return {
    embeds: [embed],
    content: `@here`,
  };
}

const fillChannelId = catchAsync(async () => {
  const room = await Room.findOne({ role: 'announce-system' });
  const guild = await client.guilds.fetch(process.env.GUILD);
  everyoneRole = await guild.roles.fetch(processData.get('everyoneRole'));

  if (room) announceChannelId = room.discordId;
  else announceChannelId = undefined;
});

fillChannelId();

client.on(
  'messageCreate',
  catchAsync(async (msg) => {
    if (msg.content === '-announce-tool') {
      const queryObject = {
        discordId: announceChannelId,
        role: 'announce-system',
      };
      if (announceChannelId) delete queryObject.role;
      else delete queryObject.discordId;

      let room = await Room.findOne(queryObject);

      if (!room) room = new Room({ role: 'announce-system' });

      room.discordId = msg.channelId;

      await room.save();

      const embed = new EmbedBuilder()
        .setDescription(
          'فقط أرسل محتوى كلامك، وسيتم الإعلان عنه في الروم المحدد'
        )
        .setTitle('نجاح')
        .setColor('Green');

      msg.channel.send({ embeds: [embed] });
    } else if (!msg.author.bot && msg.channelId === announceChannelId) {
      const dataSplit = msg.content.split('---');
      if (dataSplit.length < 4 || dataSplit.length > 4)
        return msg.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('خطأ')
              .setColor('#e03131')
              .setDescription('يرجى إرسال الرساله بشكل صحيح'),
          ],
        });

      const [title, content, message, channelId] = dataSplit.map((data) =>
        data.trim()
      );

      const builtMessage = buildMessage(title, content, message);

      let channel;
      try {
        channel = await msg.guild.channels.fetch(channelId);
        if (!channel)
          return msg.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('#e03131')
                .setTitle('حدث خطأ')
                .setDescription('Incorrect channel ID'),
            ],
          });
      } catch (e) {
        return msg.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('#e03131')
              .setTitle('حدث خطأ')
              .setDescription('Incorrect channel ID'),
          ],
        });
      }

      channel.send(builtMessage);
    }
  })
);
