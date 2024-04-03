const { SlashCommandBuilder, GuildChannel } = require('discord.js');
const processData = require('../../utils/processData.js');
const PrivateChat = require('../../models/privateChatModel.js');

const crewRoleId = processData.get('crewRoleId');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unalignme')
    .setDescription('خاص بالمدراء، لإزالة نفسك كمراقب للشات'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const privateChat = await PrivateChat.findOne({
      discordId: interaction.channel.id,
    });

    if (!privateChat)
      return interaction.editReply({
        content: 'هذا الأمر مخصص للمحادثات الخاصه فقط',
      });

    if (privateChat.mod !== interaction.user.id)
      return interaction.editReply({ content: 'انت لست المراقب بالأصل' });

    const privateChannel = await interaction.guild.channels.fetch(
      privateChat.discordId
    );

    const promises = privateChat.members.map(async (id) => {
      await privateChannel.permissionOverwrites.edit(id, {
        SendMessages: false,
      });
    });

    await privateChannel.permissionOverwrites.edit(privateChat.owner, {
      SendMessages: false,
    });

    await Promise.all(promises);

    await privateChat.updateOne({
      status: 'down',
      mod: 'ua',
      $push: {
        mods: {
          discordId: interaction.user.id,
          addedAt: Date.now(),
          operation: 'left',
        },
      },
    });

    interaction.editReply({
      content: 'انت لم تعد المراقب',
    });
  },

  allow: [crewRoleId],
};
