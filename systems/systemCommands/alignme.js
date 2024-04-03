const { SlashCommandBuilder, GuildChannel } = require('discord.js');
const processData = require('../../utils/processData.js');
const PrivateChat = require('../../models/privateChatModel.js');

const crewRoleId = processData.get('crewRoleId');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('alignme')
    .setDescription('خاص بالمدراء، لإضافة نفسك كمراقب للشات'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const privateChat = await PrivateChat.findOne({
      discordId: interaction.channel.id,
    });

    if (!privateChat)
      return interaction.editReply({
        content: 'هذا الأمر مخصص للمحادثات الخاصه فقط',
      });

    if (privateChat.mod !== 'ua')
      return interaction.editReply({ content: 'يوجد مدير يراقب الشات بالأصل' });

    const privateChannel = await interaction.guild.channels.fetch(
      privateChat.discordId
    );

    const promises = privateChat.members.map(async (id) => {
      await privateChannel.permissionOverwrites.edit(id, {
        SendMessages: true,
      });
    });

    await privateChannel.permissionOverwrites.edit(privateChat.owner, {
      SendMessages: true,
    });

    await Promise.all(promises);

    await privateChat.updateOne({
      status: 'active',
      mod: interaction.user.id,
      $push: {
        mods: {
          discordId: interaction.user.id,
          addedAt: Date.now(),
          operation: 'join',
        },
      },
    });

    interaction.editReply({
      content:
        'أنت الآن المراقب لهذا الشات والمسؤول اذا حدثت اي عملية خبيثه هنا',
    });
  },

  allow: [crewRoleId],
};
