const { SlashCommandBuilder } = require('discord.js');

const allowedToAddRoles_ticket = ['1145704445158625360'];
const allowedToAddRoles_mod = ['1145704434601570344', '1145704421615992922'];
const mod = '1145704433087418419';
const ticket = '1145704443858391161';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ungrant')
    .setDescription(
      'إضافة رتبه للشخص، لا تسلب أي رتبه خارجه عن وظيفتك كـ مدير تذاكر، أو كــ مسؤول إداره،  خاص بــ مدير التذاكر، ومسؤول الإداره'
    )
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
      allowedToAddRoles_mod.includes(role.id)
    ) {
      member.roles.remove(role);
      return rep();
    } else if (
      executer.roles.cache.some((role) => role.id === ticket) &&
      allowedToAddRoles_ticket.includes(role.id)
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
