const catchAsync = require('../utils/catchAsync.js');
const client = require('../utils/discordClient.js');
const { ChannelType } = require('discord.js');

client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member;
  const oldChannel = oldState.channel;
  const channel = member?.voice?.channel;

  if (
    channel &&
    channel.members.size === 1 &&
    channel.id === '1201133233098735636'
  ) {
    const newChannel = await channel.guild.channels.create({
      name: 'CVC┊مجلس سوالف',
      type: ChannelType.GuildVoice,
      userLimit: 20,
      parent: channel.parentId,
    });

    member.voice.setChannel(newChannel);
  }

  if (
    oldChannel &&
    oldChannel.name.startsWith('CVC') &&
    oldChannel.members.size < 1
  ) {
    // It is Chat Voice Channel, and it is empty now
    await oldChannel.delete();
  }
});
