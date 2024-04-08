const { REST, Routes } = require('discord.js');
const client = require('../utils/discordClient.js');
const { readdirSync } = require('fs');
const path = require('path');
const catchAsync = require('../utils/catchAsync.js');
const processDate = require('../utils/processData.js');

const dirPath = path.join(__dirname, '/systemCommands');
const files = readdirSync(dirPath);
const commands = [];

(() => {
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
  }
})();

const rest = new REST().setToken(process.env.BOT_TOKEN);

client.on(
  'ready',
  catchAsync(async () => {
    const data = await rest.get(
      Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD)
    );

    const fetchedCommandsNames = data.map((command) => command.name + '.js');

    const changed = fetchedCommandsNames.reduce((acc, command) => {
      if (acc) return acc;

      if (files.includes(command)) return true;
      else false;
    }, false);
    if (!changed) return;
    else {
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD),
        { body: commands }
      );
    }
  })
);

client.on(
  'interactionCreate',
  catchAsync(async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = files.find(
      (file) => file === interaction.commandName + '.js'
    );

    if (!command && !interaction.replied)
      return interaction.reply({
        ephemeral: true,
        content: `هذا الأمر غير موجود`,
      });

    const { execute, allow } = require(path.join(dirPath, command));

    if (allow) {
      const executer = await interaction.member.fetch();
      if (!executer.roles.cache.some((role) => allow.includes(role.id)))
        return interaction.reply({
          ephemeral: true,
          content: 'ليس لديك الصلاحية استخدام هذا الامر',
        });
    }

    await execute(interaction);
  })
);
