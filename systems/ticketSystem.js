const Room = require('../models/roomsModel.js');
const Ticket = require('../models/ticketModel.js');
const {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require('discord.js');
const crypto = require('crypto');
const publicEventEmitter = require('../utils/multiEventEmitter.js');
const catchAsync = require('../utils/catchAsync.js');

let ticketSystemChannelId;
const ticketSystemCatsIds = [];
let closedTicketSystemCatId;
const ticketTypes = ['ban', 'mod', 'pro'];

const fillChannelCategoryId = async () => {
  const room = await Room.findOne({ role: 'ticket-system' });
  const ticketCategories = await Room.find({
    role: { $regex: '^ticket-dir_' },
  });
  const closedTicketCategory = await Room.findOne({
    role: 'closed-ticket-dir',
  });

  if (ticketCategories)
    ticketCategories.forEach((ticketCategory) => {
      ticketSystemCatsIds.push({
        id: ticketCategory.discordId,
        ticket: ticketCategory.role.split('_')[1],
      });
    });

  if (closedTicketCategory) {
    closedTicketSystemCatId = closedTicketCategory.discordId;
  }

  if (room) ticketSystemChannelId = room.discordId;
  else ticketSystemChannelId = undefined;
};

fillChannelCategoryId();

publicEventEmitter.on('ticket-channel-update', () => {
  fillChannelCategoryId();
});

exports.updateTicketChannel = catchAsync(async (channelId, client) => {
  const queryObject = {
    discordId: ticketSystemChannelId,
    role: 'ticket-system',
  };
  if (ticketSystemChannelId) delete queryObject.role;
  else delete queryObject.discordId;

  let room = await Room.findOne(queryObject);

  if (!room) room = new Room({ role: 'ticket-system' });

  room.discordId = channelId;

  await room.save();

  const channel = await client.channels.fetch(channelId);

  const embed = new EmbedBuilder()
    .setTitle('فتح تذكرة دعم')
    .setDescription(
      'يرجى فتح هذه التذكره فقط في حال احتجت دعما، واضغط على الزر المناسب أدناه'
    )
    .setColor('#66d9e8');

  const buttonMod = new ButtonBuilder()
    .setCustomId('start-mod-ticket')
    .setStyle(ButtonStyle.Primary)
    .setLabel('تذكرة إداره')
    .setEmoji('🎫');
  const buttonProgramming = new ButtonBuilder()
    .setCustomId('start-programming-ticket')
    .setStyle(ButtonStyle.Success)
    .setLabel('تذكرة برمجه')
    .setEmoji('🎫');
  const buttonBan = new ButtonBuilder()
    .setCustomId('start-ban-ticket')
    .setStyle(ButtonStyle.Danger)
    .setLabel('تذكرة باند')
    .setEmoji('🎫');

  const row = new ActionRowBuilder().addComponents(
    buttonMod,
    buttonProgramming,
    buttonBan
  );

  channel.send({
    embeds: [embed],
    components: [row],
  });

  publicEventEmitter.emit('ticket-channel-update');
});

exports.setCategory = catchAsync(async (channel, client, content) => {
  if (!ticketTypes.includes(content)) {
    return channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('حدث خطأ')
          .setDescription('هذا النوع من التذكره غير صحيح')
          .setColor('#66d9e8'),
      ],
    });
  }

  const catRole = `ticket-dir_${content}`;
  if (await Room.findOne({ role: catRole })) {
    return channel.send('لا تستطيع إعادة تعيين ملفات التكتات');
  }

  const room = await Room.create({
    discordId: channel.parentId,
    role: catRole,
  });

  ticketSystemCatsIds.push({
    id: room.discordId,
    ticket: room.role.split('_')[1],
  });

  channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle('تمت العمليه بنجاح')
        .setDescription('هذا الملف سيتم عمل فيه قنوات الدعم')
        .setColor('#66d9e8'),
    ],
  });
});

exports.setClosedCategory = catchAsync(async (channel) => {
  if (await Room.findOne({ role: 'closed-ticket-dir' })) {
    return channel.send('لا يمكنك تحديد ملف التذاكر المغلقه الا مره واحده');
  }

  const room = await Room.create({
    discordId: channel.parentId,
    role: 'closed-ticket-dir',
  });

  closedTicketSystemCatId = channel.parentId;

  channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle('تمت العمليه بنجاح')
        .setDescription('سيتم نقل جميع تذاكر الدعم المغلقه')
        .setColor('#66d9e8'),
    ],
  });
});

exports.createTicket = catchAsync(async (interaction, customId, client) => {
  if (ticketSystemCatsIds.length < 1) {
    interaction.channel.send('للأسف، لا يمكن فتح تذكره الآن');
  }

  const guild = await interaction.guild.fetch();

  const allowedTicketRoles = ['1145704443858391161', '1145704445158625360'];

  let channel;
  const ticketId = crypto.randomBytes(3).toString('base64').toLowerCase();

  const category = ticketSystemCatsIds.find(
    ({ ticket }) => ticket === customId.slice(0, 3)
  );
  if (!category) return 'حدث خطأ';

  channel = await guild.channels.create({
    name: `${customId}-case┊${interaction.user.displayName}┊${ticketId}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.id, // Deny everyone (including @everyone) access
        deny: ['ViewChannel'],
      },
      {
        id: interaction.user.id, // Allow access to a specific user
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      },
      ...allowedTicketRoles.map((roleId) => ({
        id: roleId, // Allow access to each role in allowedTicketRoles
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      })),
    ],
  });

  const ticket = await Ticket.create({
    userId: interaction.user.id,
    ticketChannel: channel.id,
    type: category.ticket,
    ticketId,
  });

  const embed = new EmbedBuilder()
    .setTitle('تذكره')
    .setDescription('تم إنشاء هذه التذكره')
    .setColor('#66d9e8');

  const buttonClose = new ButtonBuilder()
    .setCustomId(`close-ticket-${ticket._id}`)
    .setStyle(ButtonStyle.Danger)
    .setLabel('إغلاق التذكره')
    .setEmoji('🎫');

  const row = new ActionRowBuilder().addComponents(buttonClose);

  channel.send({
    embeds: [embed],
    components: [row],
  });
});

exports.closeTicket = catchAsync(
  async (channel, ticketId, client, interaction) => {
    if (!closedTicketSystemCatId) return channel.send('لا يمكن إغلاق التذكره');

    const ticket = await Ticket.findById(ticketId).findOne({ active: true });

    if (!ticket) return 'هذه التذكره مغلقه بالفعل';

    const guild = await client.guilds.fetch(channel.guildId);

    const parentCategory = client.channels.cache.get(closedTicketSystemCatId);

    ticket.active = false;
    await channel.setParent(parentCategory);
    await ticket.save();

    const embed = new EmbedBuilder()
      .setTitle('تذكره')
      .setDescription('تم إغلاق هذه التذكره')
      .setColor('#66d9e8');

    channel.send({ embeds: [embed] });

    return false;
  }
);
