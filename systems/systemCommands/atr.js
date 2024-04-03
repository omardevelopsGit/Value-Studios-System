const { SlashCommandBuilder, GuildChannel, Guild } = require('discord.js');
const processData = require('../../utils/processData.js');
const PrivateChat = require('../../models/privateChatModel.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('atr')
    .setDescription('خاص بمكن يملك الروم الخاص، لإضافة أشخاص الى الشات الخاص')
    .addUserOption((option) =>
      option
        .setName('member')
        .setDescription('الشخص الذي تريد اضافته')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.options.getMember('member');

    const privateChat = await PrivateChat.findOne({
      discordId: interaction.channelId,
    });

    if (!privateChat)
      return interaction.editReply({
        content: 'هذا الأمر مخصص للمحادثات الخاصه',
      });

    if (privateChat.owner.trim() !== interaction.user.id)
      return interaction.editReply({
        content: 'أنت لست مالك هذه المحادثه',
      });

    const privateChannel = await interaction.guild.channels.fetch(
      privateChat.discordId
    );

    await privateChannel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: false,
    });

    await privateChat.updateOne({
      $push: { members: member.id },
    });

    interaction.editReply({
      content: 'تمت إضافته بنجاح',
    });
  },
};
