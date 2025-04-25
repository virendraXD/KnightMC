const User = require('../../models/user');

module.exports = {
  name: 'sell',

  async execute(message, args) {
    const userId = message.author.id;
    const user = await User.findOne({ userId });

    if (!user) {
      return message.reply("⛏️ You haven't mined anything yet! Use `!mine` first.");
    }

    const item = args[0]?.toLowerCase();
    const quantity = parseInt(args[1]) || 1;

    const sellPrices = {
      cobblestone: 1,
      coal: 3,
      iron: 6,
      diamond: 12,
      emerald: 25
    };

    if (!item || !sellPrices[item]) {
      return message.reply("🪙 Please specify a valid item to sell. Example: `!sell coal 5`");
    }

    if (quantity <= 0 || isNaN(quantity)) {
      return message.reply("❗ Quantity must be a valid number greater than 0.");
    }

    if ((user.inventory[item] ?? 0) < quantity) {
      return message.reply(`❌ You don't have ${quantity} ${item}(s) to sell!`);
    }

    const total = quantity * sellPrices[item];

    user.inventory[item] -= quantity;
    user.coins = (user.coins ?? 0) + total;
    await user.save();

    return message.reply(`✅ Sold ${quantity} ${item} for 💰 ${total} coins! You now have ${user.coins} coins.`);
  }
};
