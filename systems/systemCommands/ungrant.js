const { SlashCommandBuilder } = require('discord.js');
const processData = require('../../utils/processData.js');

const allowedToRemoveRoles_ticket = processData.get(
  'allowedToRemoveRoles_ticket'
);
const allowedToRemoveRoles_mod = processData.get('allowedToRemoveRoles_mod');
const mod = processData.get('modeRoleId');
const ticket = processData.get('ticketRoleId');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ungrant')
    .setDescription('خاص بــ مدير التذاكر، ومسؤول الإداره')
    .addUserOption((option) =>
      option
        .setName('member')
        .setDescription('الشخص مسلوب الرتبه')
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option.setName('role').setDescription('الرتبه المسلوبه').setRequired(true)
    ),

  async execute(interaction) {
    const executer = await interaction.member.fetch();
    const role = interaction.options.getRole('role');
    const member = interaction.options.getMember('member');

    function rep() {
      interaction.reply({
        ephemeral: true,
        content: 'تمت إزالة الرتبه',
      });
    }
    if (
      executer.roles.cache.some((role) => role.id === mod) &&
      allowedToRemoveRoles_mod.includes(role.id)
    ) {
      member.roles.remove(role);
      return rep();
    } else if (
      executer.roles.cache.some((role) => role.id === ticket) &&
      allowedToRemoveRoles_ticket.includes(role.id)
    ) {
      member.roles.remove(role);
      return rep(); // I know that this code is not compatble with DRY, but I don't feel safe to put them together
    } else {
      return interaction.reply({
        ephemeral: true,
        content: 'غير مصرح لك باستخدام هذا الأمر',
      });
    }
  },
};
