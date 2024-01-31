const { SlashCommandBuilder } = require('discord.js');
const processData = require('../../utils/processData.js');

const allowedToAddRoles_ticket = processData.get('allowedToAddRoles_ticket');
const allowedToAddRoles_mod = processData.get('allowedToAddRoles_mod');
const mod = processData.get('modeRoleId');
const ticket = processData.get('ticketRoleId');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grant')
    .setDescription('خاص بــ مدير التذاكر، ومسؤول الإداره')
    .addUserOption((option) =>
      option
        .setName('member')
        .setDescription('الشخص معطى الرتبه')
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option.setName('role').setDescription('الرتبه المعطاه').setRequired(true)
    ),

  async execute(interaction) {
    const executer = await interaction.member.fetch();
    const role = interaction.options.getRole('role');
    const member = interaction.options.getMember('member');

    function rep() {
      interaction.reply({
        ephemeral: true,
        content: 'تمت إضافة الرتبه',
      });
    }
    if (
      executer.roles.cache.some((role) => role.id === mod) &&
      allowedToAddRoles_mod.includes(role.id)
    ) {
      member.roles.add(role);
      return rep();
    } else if (
      executer.roles.cache.some((role) => role.id === ticket) &&
      allowedToAddRoles_ticket.includes(role.id)
    ) {
      member.roles.add(role);
      return rep(); // I know that this code is not compatble with DRY, but I don't feel safe to put them together
    } else {
      return interaction.reply({
        ephemeral: true,
        content: 'غير مصرح لك باستخدام هذا الأمر',
      });
    }
  },
};
