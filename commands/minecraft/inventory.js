const { emojisToUpload } = require('../../index'); // Adjust the path if needed
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

      // Find the image URLs from emojisToUpload
      const cobblestoneImage = emojisToUpload.find(emoji => emoji.name === 'cobblestone')?.url || 'https://via.placeholder.com/50';
      const coalImage = emojisToUpload.find(emoji => emoji.name === 'coal')?.url || 'https://via.placeholder.com/50';
      const ironImage = emojisToUpload.find(emoji => emoji.name === 'iron')?.url || 'https://via.placeholder.com/50';
      const diamondImage = emojisToUpload.find(emoji => emoji.name === 'diamond')?.url || 'https://via.placeholder.com/50';
      const emeraldImage = emojisToUpload.find(emoji => emoji.name === 'emerald')?.url || 'https://via.placeholder.com/50';

      // Build the inventory message using image URLs
      const inventoryMessage = 
        `**🧰 Your Inventory:**\n` +
        `${inv.cobblestone > 0 ? `![cobble](${cobblestoneImage})` : ''} ${inv.cobblestone || 0}\n` +
        `${inv.coal > 0 ? `![coal](${coalImage})` : ''} ${inv.coal || 0}\n` +
        `${inv.iron > 0 ? `![iron](${ironImage})` : ''} ${inv.iron || 0}\n` +
        `${inv.diamond > 0 ? `![diamond](${diamondImage})` : ''} ${inv.diamond || 0}\n` +
        `${inv.emerald > 0 ? `![emerald](${emeraldImage})` : ''} ${inv.emerald || 0}`;

      return message.reply({ content: inventoryMessage });

    } catch (err) {
      console.error("Inventory command error:", err);
      return message.reply("⚠️ Couldn't fetch your inventory.");
    }
  }
};
