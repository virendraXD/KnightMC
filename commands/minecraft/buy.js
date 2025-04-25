const User = require('../../models/user');

module.exports = {
  name: 'buy',

  async execute(message, args) {
    const userId = message.author.id;
    const user = await User.findOne({ userId });

    if (!user) {
      return message.reply("🪨 You need to start mining first with `!mine` before you can buy items!");
    }

    const item = args[0]?.toLowerCase();
    if (!item) {
      return message.reply("❗ Please specify an item to buy. Example: `!buy torch`");
    }

    switch (item) {
      case 'upgrade':
      case 'pickaxe': {
        const costByLevel = {
          1: { resource: 'coal', amount: 10 },
          2: { resource: 'iron', amount: 5 },
          3: { resource: 'diamond', amount: 2 },
          4: { resource: 'emerald', amount: 1 }
        };

        const nextLevel = user.pickaxeLevel + 1;
        const cost = costByLevel[user.pickaxeLevel];

        if (!cost) {
          return message.reply("🛠️ Your pickaxe is already maxed out!");
        }

        if ((user.inventory[cost.resource] ?? 0) < cost.amount) {
          return message.reply(`❌ You need ${cost.amount} ${cost.resource} to upgrade your pickaxe!`);
        }

        user.inventory[cost.resource] -= cost.amount;
        user.pickaxeLevel = nextLevel;
        await user.save();

        return message.reply(`✅ Your pickaxe has been upgraded to level ${nextLevel}!`);
      }

      case 'torch': {
        if ((user.inventory.coal ?? 0) < 5) {
          return message.reply("❌ Not enough coal. You need 5 coal to buy a torch.");
        }

        user.inventory.coal -= 5;
        await user.save();

        return message.reply("🕯️ You bought a torch! (It’s just cosmetic... for now!)");
      }

      case 'lucky':
      case 'charm': {
        if (user.hasLuckyCharm) {
          return message.reply("🍀 You already have a Lucky Charm!");
        }

        if ((user.inventory.emerald ?? 0) < 1) {
          return message.reply("❌ You need 1 emerald to buy a Lucky Charm.");
        }

        user.inventory.emerald -= 1;
        user.hasLuckyCharm = true;
        await user.save();

        return message.reply("🍀 You bought a Lucky Charm! Rare drop chances are boosted.");
      }

      case 'super':
      case 'boost': {
        if ((user.inventory.diamond ?? 0) < 10) {
          return message.reply("❌ You need 10 diamonds to buy a Super Pickaxe.");
        }

        user.inventory.diamond -= 10;
        user.boostExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        return message.reply("💎 You bought a Super Pickaxe! Boost is active for 10 minutes.");
      }

      default:
        return message.reply("❓ That item doesn't exist in the shop. Type `!shop` to see available items.");
    }
  }
};
