const { EmbedBuilder } = require('@discordjs/builders');
const client = require('../utils/discordClient.js');
const processData = require('../utils/processData.js');
const catchAsync = require('../utils/catchAsync.js');

const suggestionRoomId = processData.get('suggestionRoomId');

client.on('messageCreate', async (msg) => {
  if (msg.channelId !== suggestionRoomId || msg.author.bot) return;

  if (processData.get('checker')(msg.content)) return;

  const embed = new EmbedBuilder().setAuthor({
    name: msg.author.displayName,
    iconURL: msg.author.avatarURL(),
  });

  const content = `
        # إقتراح #\n
        ### ${Intl.DateTimeFormat('ar-JO', {
          hour: 'numeric',
          minute: 'numeric',
          day: 'numeric',
          weekday: 'long',
          month: 'long',
          year: 'numeric',
        }).format(msg.createdAt)} ###
        \n
        يقترح <@${msg.author.id}>
        \n
        >>> ${msg.content}\
        \n\n
        أتتفق معه؟
    `;
  const botMsg = await msg.channel.send({
    embeds: [embed],
    content,
  });

  botMsg.react('✅');
  botMsg.react('❌');

  await msg.delete();
});
