const User = require('../../models/user'); // adjust the path if needed

module.exports = {
  name: 'mine',

  async execute(message) {
    try {
      const userId = message.author.id;
      const cooldown = 30000;

      let user = await User.findOne({ userId });

      if (!user) {
        user = new User({ userId });
      } else if (user.lastMine && Date.now() - user.lastMine < cooldown) {
        const timeLeft = Math.ceil((cooldown - (Date.now() - user.lastMine)) / 1000);
        return message.reply(`⏳ Please wait ${timeLeft}s before mining again!`);
      }

      const lootTable = [
        { item: 'cobblestone', chance: 50 },
        { item: 'coal', chance: 30 },
        { item: 'iron', chance: 12 },
        { item: 'diamond', chance: 6 },
        { item: 'emerald', chance: 2 }
      ];
      
      // Check if Super Pickaxe boost is active
      const boostActive = user.boostExpires && user.boostExpires > Date.now();

      if (boostActive) {
        lootTable.find(i => i.item === 'diamond').chance += 4; // Boost diamond
        lootTable.find(i => i.item === 'emerald').chance += 2; // Boost emerald
      }

      // Optional Lucky Charm or Super Pickaxe bonus
      if (user.hasLuckyCharm || (user.boostExpires && user.boostExpires > Date.now())) {
        lootTable.find(i => i.item === 'diamond').chance += 2;
        lootTable.find(i => i.item === 'emerald').chance += 1;
      }

      const roll = Math.random() * 100;
      let total = 0;
      let foundItem = 'cobblestone';

      for (let i of lootTable) {
        total += i.chance;
        if (roll <= total) {
          foundItem = i.item;
          break;
        }
      }

      if (!user.inventory[foundItem]) {
        user.inventory[foundItem] = 0;
      }
      
      let boostNote = '';
      if (boostActive) boostNote = ' 🚀 **Super Pickaxe Boost active!**';
      return message.reply(`⛏️ You mined and found **1 ${foundItem}**!${boostNote}`);
      
      user.inventory[foundItem] += 1;
      user.lastMine = Date.now();
      await user.save();

      return message.reply(`⛏️ You mined and found **1 ${foundItem}**!`);
    } 
    catch (err) {
    console.error("Mine command error:", err);
    return message.reply("⚠️ An error occurred while mining.");
    }
  }
};
