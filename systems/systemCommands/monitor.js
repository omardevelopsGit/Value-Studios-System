const { SlashCommandBuilder, ChannelType } = require('discord.js');
const Player = require('../voiceSystem.js');

const valueCrewRoleId = processData.get('crewRoleId');

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
    await interaction.deferReply({ ephemeral: true });
    const voiceChannel = interaction.options.getChannel('voice');
    const duration = interaction.options.getNumber('duration');

    const executer = await interaction.member.fetch();
    if (!executer.roles.cache.some((role) => role.id === valueCrewRoleId))
      return interaction.reply({
        ephemeral: true,
        content: 'ليس لديك الصلاحيه باستخدام هذا الامر',
      });

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

    interaction.editReply({ content: 'جار مراقبة الغرفه الصوتيه' });
  },
};
