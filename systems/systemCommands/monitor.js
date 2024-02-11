const { SlashCommandBuilder, ChannelType } = require('discord.js');
const Player = require('../voiceSystem.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('monitor')
    .setDescription('مراقبة غرفه صوتيه وتسجيل الصوتيات')
    .addChannelOption((option) =>
      option
        .setName('voice')
        .setDescription('الغرفه المراد مراقبتها')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    )
    .addNumberOption((option) => {
      return option
        .setName('duration')
        .setDescription('المده التي سيتم مراقبة الروم فيها');
    }),

  async execute(interaction) {
    const voiceChannel = interaction.options.getChannel('voice');
    const duration = interaction.options.getNumber('duration');

    const player = new Player(voiceChannel.id);
    const { stream } = await player.createUploadStream();
    const usersId = voiceChannel.members.map((member) => member.user.id);
    const args =
      duration > 0 && duration
        ? [usersId, stream, { duration }]
        : [usersId, stream];

    player.on('ready', () => {
      player.createListeningStream(...args);
    });
  },
};
