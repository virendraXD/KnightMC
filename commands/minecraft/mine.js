const { Client, Intents } = require('discord.js');
const User = require('../../models/user');

module.exports = {
  name: 'mine',

  async execute(message) {
    try {
      const userId = message.author.id;
      let baseCooldown = 10000; // 30 seconds
      let user = await User.findOne({ userId });

      if (!user) {
        user = new User({ userId, coins: 0, inventory: {}, job: null });
      }

      // Apply job-based cooldown reduction
      if (user.job === 'Miner') {
        baseCooldown = Math.floor(baseCooldown * 0.6); // 40% cooldown reduction
      }

      if (user.lastMine && Date.now() - user.lastMine < baseCooldown) {
        const timeLeft = Math.ceil((baseCooldown - (Date.now() - user.lastMine)) / 1000);
        return message.reply(`⏳ Please wait ${timeLeft}s before mining again!`);
      }

      const lootTable = [
        { item: 'cobblestone', chance: 50 },
        { item: 'coal', chance: 30 },
        { item: 'iron', chance: 12 },
        { item: 'diamond', chance: 6 },
        { item: 'emerald', chance: 2 }
      ];

      const itemEmojis = {
        cobblestone: 'cobblestone',
        coal: 'coal',
        iron: 'iron',
        diamond: 'diamond',
        emerald: 'emerald',
      };

      const boostActive = user.boostExpires && user.boostExpires > Date.now();

      if (boostActive) {
        lootTable.find(i => i.item === 'diamond').chance += 4;
        lootTable.find(i => i.item === 'emerald').chance += 2;
      }

      if (user.hasLuckyCharm) {
        lootTable.find(i => i.item === 'diamond').chance += 2;
        lootTable.find(i => i.item === 'emerald').chance += 1;
      }

      if (user.job === 'Miner') {
        // Miner job gives extra cobblestone chance
        lootTable.find(i => i.item === 'cobblestone').chance += 10;
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

      // Coin reward base
      let coinReward = Math.floor(Math.random() * 5) + 1;

      // Blacksmith job bonus: chance to double coins
      if (user.job === 'Blacksmith' && Math.random() < 0.2) { // 20% chance
        coinReward *= 2;
      }

      if (!user.coins) user.coins = 0;
      user.coins += coinReward;

      // Treasure Hunter bonus: random bonus item chance
      if (user.job === 'Treasure Hunter' && Math.random() < 0.1) { // 10% chance
        const bonusLoot = ['diamond', 'emerald', 'iron'];
        const bonusItem = bonusLoot[Math.floor(Math.random() * bonusLoot.length)];
        if (!user.inventory[bonusItem]) user.inventory[bonusItem] = 0;
        user.inventory[bonusItem] += 1;

        const bonusEmoji = message.guild.emojis.cache.find(e => e.name === itemEmojis[bonusItem]);
        await message.reply(`🏴‍☠️ As a Treasure Hunter, you found a bonus ${bonusEmoji ? bonusEmoji.toString() : bonusItem}!`);
      }

      user.lastMine = Date.now();
      await user.save();

      const emoji = message.guild.emojis.cache.find(e => e.name === itemEmojis[foundItem]);
      return message.reply(`⛏️ You mined and found 1 ${emoji ? emoji.toString() : foundItem}!\n 💰 You also found **${coinReward} 🪙 Minecoin(s)**!`);

    } catch (err) {
      console.error("Mine command error:", err);
      return message.reply("⚠️ An error occurred while mining.");
    }
  }
};
