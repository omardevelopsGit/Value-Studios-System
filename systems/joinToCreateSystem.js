const catchAsync = require('../utils/catchAsync.js');
const client = require('../utils/discordClient.js');
const { ChannelType } = require('discord.js');
const processData = require('../utils/processData.js');

client.on(
  'voiceStateUpdate',
  catchAsync(async (oldState, newState) => {
    const member = newState.member;
    const oldChannel = oldState.channel;
    const channel = member?.voice?.channel;

    if (
      channel &&
      channel.members.size === 1 &&
      channel.id === processData.get('joinToCreateRoom')
    ) {
      const newChannel = await channel.guild.channels.create({
        name: 'CVC┊مجلس سوالف',
        type: ChannelType.GuildVoice,
        userLimit: 20,
        parent: channel.parentId,
      });

      member.voice.setChannel(newChannel);
    }

    const filteredOldChannelMembers = oldChannel.members.filter(
      (member) => !member.user.bot
    );

    if (
      oldChannel &&
      oldChannel.name.startsWith('CVC') &&
      filteredOldChannelMembers.size < 1
    ) {
      // It is Chat Voice Channel, and it is empty now
      await oldChannel.delete();
    }
  })
);
