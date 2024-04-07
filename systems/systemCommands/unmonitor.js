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
    await interaction.deferReply({ ephemeral: true });
    const duration = interaction.options.getNumber('duration');

    const executer = await interaction.member.fetch();
    if (
      !executer.roles.cache.some(
        (role) => role.id === processData.get('crewRoleId')
      )
    )
      return interaction.reply({
        ephemeral: true,
        content: 'ليس لديك الصلاحيه باستخدام هذا الامر',
      });

    const player = processData.get('player');
    player?.stopListining(duration || undefined);

    interaction.editReply({
      content: 'توقفت عملية مراقبة الغرفه الصوتيه وتم حفظها',
    });
  },
};
