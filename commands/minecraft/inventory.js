const { EmbedBuilder } = require('discord.js');
const { emojisToUpload } = require('../../index');
const User = require('../../models/user');

module.exports = {
  name: 'inventory',

  async execute(message) {
    try {
      const userId = message.author.id;
      const user = await User.findOne({ userId });

      if (!user) {
        return message.reply("📦 You don't have any inventory yet. Use `!mine` to start!");
      }

      const inv = user.inventory || {};

      // Find the image URLs
      const cobblestoneImage = emojisToUpload.find(emoji => emoji.name === 'cobblestone')?.url || 'https://via.placeholder.com/50';
      const coalImage = emojisToUpload.find(emoji => emoji.name === 'coal')?.url || 'https://via.placeholder.com/50';
      const ironImage = emojisToUpload.find(emoji => emoji.name === 'iron')?.url || 'https://via.placeholder.com/50';
      const diamondImage = emojisToUpload.find(emoji => emoji.name === 'diamond')?.url || 'https://via.placeholder.com/50';
      const emeraldImage = emojisToUpload.find(emoji => emoji.name === 'emerald')?.url || 'https://via.placeholder.com/50';

      // Build the embed with inline fields showing emojis and image counts
      const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Inventory`)
        .setColor('#FE7743')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: `Coal`, value: `${inv.coal || 0}`, inline: true },
          { name: `Cobblestone`, value: `${inv.cobblestone || 0}`, inline: true },
          { name: `Diamond`, value: `${inv.diamond || 0}`, inline: true },
          { name: `Iron`, value: `${inv.iron || 0}`, inline: true },
          { name: `Emerald`, value: `${inv.emerald || 0}`, inline: true }
        )


      return message.reply({ embeds: [embed] });

    } catch (err) {
      console.error("Inventory command error:", err);
      return message.reply("⚠️ Couldn't fetch your inventory.");
    }
  }
};
