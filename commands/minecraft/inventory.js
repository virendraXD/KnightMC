const User = require('../models/User');

module.exports = {
  name: 'inventory',

  async execute(message, args) {
    const userId = message.author.id;
    const user = await User.findOne({ userId });

    if (!user) {
      return message.reply("You don't have any inventory yet. Use `!mine` to start!");
    }

    const inv = user.inventory;
    message.reply(
      `**Your Inventory:**\n` +
      `Cobblestone: ${inv.cobblestone}\n` +
      `Coal: ${inv.coal}\n` +
      `Iron: ${inv.iron}\n` +
      `Diamond: ${inv.diamond}\n` +
      `Emerald: ${inv.emerald}`
    );
  }
};
