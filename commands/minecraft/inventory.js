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

      const inv = user.inventory;
      return message.reply(
        `**🧰 Your Inventory:**\n` +
        `Cobblestone: ${inv.cobblestone}\n` +
        `Coal: ${inv.coal}\n` +
        `Iron: ${inv.iron}\n` +
        `Diamond: ${inv.diamond}\n` +
        `Emerald: ${inv.emerald}`
      );
    } catch (err) {
      console.error("Inventory command error:", err);
      return message.reply("⚠️ Couldn't fetch your inventory.");
    }
  }
};
