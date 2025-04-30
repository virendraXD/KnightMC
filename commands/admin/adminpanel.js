const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const XP = require('../../models/XP');
const User = require('../../models/user'); // Minecoins stored here

module.exports = {
  name: 'adminpanel',
  description: 'Admin GUI to manage users',
  async execute(message, args) {
    const OWNER_ID = process.env.OWNER_ID;
    if (message.author.id !== OWNER_ID) return message.reply("❌ You are not authorized.");

    const user = message.mentions.users.first();
    if (!user) return message.reply("❗ Mention a user like `!adminpanel @user`");

    const userXp = await XP.findOne({ userId: user.id }) || { xp: 0, level: 0 };
    const userData = await User.findOne({ userId: user.id }) || { userId: user.id, minecoins: 0 };

    const embed = new EmbedBuilder()
      .setTitle(`Admin Panel: ${user.username}`)
      .setDescription(`🪙 Minecoins: \`${userData.minecoins}\`\n⭐ XP: \`${userXp.xp}\`\n📶 Level: \`${userXp.level}\``)
      .setColor('Gold');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`edit_xp_${user.id}`).setLabel('Edit XP').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`edit_level_${user.id}`).setLabel('Edit Level').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`edit_minecoins_${user.id}`).setLabel('Edit Minecoins').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`view_inventory_${user.id}`).setLabel('View Inventory').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`view_pets_${user.id}`).setLabel('View Pets').setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [row] });
  },

  async handleInteraction(interaction) {
    if (!interaction.customId.startsWith('edit_minecoins_')) return;

    const userId = interaction.customId.split('_')[2];
    let userData = await User.findOne({ userId });

    if (!userData) {
      userData = new User({ userId, minecoins: 0 });
      await userData.save();
    }

    await interaction.reply({ content: '✍️ Please enter the new minecoin value:', ephemeral: true });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });

    collector.on('collect', async (msg) => {
      const amount = parseInt(msg.content);
      if (isNaN(amount)) {
        return msg.reply('❌ Invalid number. Try again.');
      }

      userData.minecoins = amount;
      await userData.save();

      await msg.reply(`✅ Minecoins updated to \`${amount}\` for <@${userId}>.`);

      // Optionally update embed again here...
    });
  }
};
