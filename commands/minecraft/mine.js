const { Client, Intents } = require('discord.js');
const User = require('../../models/user'); // adjust the path if needed

module.exports = {
  name: 'mine',

  async execute(message) {
    try {
      const userId = message.author.id;
      const cooldown = 30000; // 30 seconds cooldown

      let user = await User.findOne({ userId });

      if (!user) {
        user = new User({ userId, coins: 0, inventory: {} });
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

      // Minecraft-style item emojis (uploaded)
      const itemEmojis = {
        cobblestone: 'cobblestone', // This will reference the custom emoji created in the server
        coal: 'coal',
        iron: 'iron',
        diamond: 'diamond',
        emerald: 'emerald',
      };

      // Check for Super Pickaxe boost
      const boostActive = user.boostExpires && user.boostExpires > Date.now();

      if (boostActive) {
        lootTable.find(i => i.item === 'diamond').chance += 4;
        lootTable.find(i => i.item === 'emerald').chance += 2;
      }

      if (user.hasLuckyCharm) {
        lootTable.find(i => i.item === 'diamond').chance += 2;
        lootTable.find(i => i.item === 'emerald').chance += 1;
      }

      // Roll for item
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

      // Update inventory
      if (!user.inventory[foundItem]) {
        user.inventory[foundItem] = 0;
      }
      user.inventory[foundItem] += 1;

      // Add random Minecoin reward (1-5 coins)
      const coinReward = Math.floor(Math.random() * 5) + 1;
      if (!user.coins) user.coins = 0;
      user.coins += coinReward;

      user.lastMine = Date.now();
      await user.save();

      // Get the emoji for the found item
      const emoji = message.guild.emojis.cache.find(e => e.name === itemEmojis[foundItem]);

      // Create a simple message with emoji
      return message.reply(`⛏️ You mined and found 1 ${emoji ? emoji.toString() : foundItem}!\n 💰 You also found **${coinReward} 🪙 Minecoin(s)**!`);
      
    } catch (err) {
      console.error("Mine command error:", err);
      return message.reply("⚠️ An error occurred while mining.");
    }
  }
};
