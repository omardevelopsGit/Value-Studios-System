const client = require('../utils/discordClient.js');
const PrivateChat = require('../models/privateChatModel.js');
const Room = require('../models/roomsModel.js');
const {
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  Colors,
  ActionRowBuilder,
  ChannelType,
  GuildChannel,
} = require('discord.js');
const catchAsync = require('../utils/catchAsync.js');
const EventEmitter = require('events');
const schedule = require('node-schedule');

let privateChatClosedCategory;

Room.findOne({
  role: 'private-chat_closed-category',
}).then((v) => (privateChatClosedCategory = v));

const changeEmitter = new EventEmitter();

changeEmitter.on('change', async () => {
  privateChatClosedCategory = await Room.findOne({
    role: 'private-chat_closed-category',
  });
});

client.on(
  'messageCreate',
  catchAsync(async (msg) => {
    if (msg.content.trim().split(' ')[0] !== 'private-chat') return;

    const parent = msg.channel.parentId;
    const channel = msg.channel;

    await Room.create({
      discordId: parent,
      role: 'private-chat_category',
    });

    await Room.create({
      discordId: channel.id,
      role: 'private-chat_creation',
    });

    await Room.create({
      discordId: msg.content.trim().split(' ')[1],
      role: 'private-chat_closed-category',
    });

    changeEmitter.emit('change');

    const creationButton = new ButtonBuilder()
      .setCustomId('private-chat-create')
      .setLabel('إنشاء محادثه')
      .setStyle(ButtonStyle.Success);

    const actionRow = new ActionRowBuilder().addComponents(creationButton);

    const embed = new EmbedBuilder()
      .setColor(Colors.Aqua)
      .setTitle('محادثات خاصه')
      .setDescription('يمكنك إنشاء محادثات خاصه من هنا');

    await channel.send({ embeds: [embed], components: [actionRow] });
  })
);

client.on(
  'interactionCreate',
  catchAsync(async (interaction) => {
    if (
      !interaction.isButton() ||
      interaction.customId !== 'private-chat-create'
    )
      return;
    await interaction.deferReply({ ephemeral: true });

    const privateCategory = interaction.channel.parent;

    // Readying the message up
    const closeButton = new ButtonBuilder()
      .setCustomId('private-chat-close')
      .setLabel('إغلاق محادثه')
      .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder().addComponents(closeButton);

    const embed = new EmbedBuilder().setTitle('شات خاص').setDescription(`
  # تم إنشاء شات خاص #
  \n
  في حال انتهيتم من الكلام، يرجى اغلاق الشات
  \n
  سيتم إغلاق الشات تلقائيا بعد 10 ساعات باذن الله
  \n
  شكرا، إدارة فاليو
  `);

    const privateChannel = await PrivateChat.create({
      owner: interaction.user.id,
    });

    // Creating a private channel
    const channel = await privateCategory.children.create({
      name: `private-chat-${privateChannel._id}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id, // Deny everyone (including @everyone) access
          deny: ['ViewChannel'],
        },
        {
          id: interaction.user.id, // Allow access to owner of the chat
          allow: ['ViewChannel', 'ReadMessageHistory'],
          deny: ['SendMessages'],
        },
      ],
    });

    privateChannel.discordId = channel.id;
    await privateChannel.save();

    channel.send({
      embeds: [embed],
      components: [actionRow],
    });

    // Cron job to close the channel after 10 hours
    const job = schedule.scheduleJob(
      new Date(Date.now() + 10000),
      async function () {
        // This will be executed 10 hours from the time that it was created
        // Here I will delete the channel, remove all the permissions, mark it as closed in the database

        // 1) Move channel to closed privates
        const privateChatChannel = await interaction.guild.channels.fetch(
          privateChatClosedCategory?.discordId?.trim()
        );
        channel.setParent(privateChatChannel);

        // 2) Update in the db
        const privateChat = await PrivateChat.findOne({
          discordId: channel.id,
        });
        await privateChat.updateOne({
          status: 'closed',
          mod: 'ua',
          $push:
            privateChat.mod === 'ua'
              ? {}
              : {
                  mods: {
                    discordId: privateChat.mod,
                    addedAt: Date.now(),
                    operation: 'left',
                  },
                },
          closedAt: Date.now(),
        });

        // 3) Remove all permissions
        interaction.channel.permissionOverwrites.set([
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
        ]);
      }
    );

    interaction.editReply({
      content: 'تم إنشاء الروم، يمكنك الذهاب اليه',
    });
  })
);

client.on(
  'interactionCreate',
  catchAsync(async (interaction) => {
    if (
      !interaction.isButton() ||
      interaction.customId !== 'private-chat-close'
    )
      return;

    await interaction.deferReply({ ephemeral: true });

    const privateChat = await PrivateChat.findOne({
      discordId: interaction.channelId,
    });
    await privateChat.updateOne({
      status: 'closed',
      mod: 'ua',
      $push:
        privateChat.mod === 'ua'
          ? {}
          : {
              mods: {
                discordId: privateChat.mod,
                addedAt: Date.now(),
                operation: 'left',
              },
            },
      closedAt: Date.now(),
    });

    const privateChatChannel = await interaction.guild.channels.fetch(
      privateChatClosedCategory?.discordId?.trim()
    );

    if (
      interaction.channel.parentId ===
      privateChatClosedCategory?.discordId?.trim()
    )
      return interaction.editReply({
        content: 'هذه المحادثه مغلقه بالأصل',
      });

    if (!privateChatChannel)
      return interaction.editReply({
        content: 'Could not find closed chats category',
      });

    await interaction.channel.setParent(privateChatChannel);

    interaction.channel.permissionOverwrites.set([
      {
        id: interaction.guild.id,
        deny: ['ViewChannel'],
      },
    ]);

    interaction.editReply({
      content: 'تم إغلاق التذكره بنجاح',
    });
  })
);
