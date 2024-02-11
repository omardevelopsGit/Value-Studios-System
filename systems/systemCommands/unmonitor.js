const { SlashCommandBuilder, ChannelType } = require('discord.js');
const Player = require('../voiceSystem.js');
const processData = require('../../utils/processData.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmonitor')
    .setDescription('إيقاف مراقبة غرفه صوتيه وتسجيل الصوتيات')
    .addNumberOption((option) => {
      return option
        .setName('duration')
        .setDescription('سيتم إيقاف المراقبه بعد');
    }),

  async execute(interaction) {
    const duration = interaction.options.getNumber('duration');

    const executer = await interaction.member.fetch();
    if (!executer.roles.cache.some((role) => role.id === valueCrewRoleId))
      return interaction.reply({
        ephemeral: true,
        content: 'ليس لديك الصلاحيه باستخدام هذا الامر',
      });

    const player = processData.get('player');
    player?.stopListining(duration || undefined);
  },
};
