const User = require('../../models/user'); // Assuming you have a User model

module.exports = {
  name: 'dailychest',
  aliases: ['daily', 'dc'],
  description: 'Open your daily chest and claim a reward!',
  
  async execute(message) {
    const userId = message.author.id;
    const user = await User.findOne({ userId });
    
    if (!user) {
      return message.reply("You need to use `!mine` to create your inventory first!");
    }

    const now = new Date();
    const timeSinceLastClaim = user.lastDaily ? now - new Date(user.lastDaily) : null;
    
    const cooldown = 23 * 60 * 60 * 1000; // 23 hours in milliseconds

    if (timeSinceLastClaim && timeSinceLastClaim < cooldown) {
      const timeLeft = Math.ceil((cooldown - timeSinceLastClaim) / 1000); // in seconds
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);

      return message.reply(`⏳ You already claimed your daily chest. Please wait **${hours} hours and ${minutes} minutes** before claiming again!`);
    }

    // Random reward system
    const rewards = [
      { item: 'minecoins', amount: 50 },
      { item: 'diamond', amount: 3 },
      { item: 'emerald', amount: 1 },
      { item: 'boost', amount: 1 },
      { item: 'lucky charm', amount: 1 },
      { item: 'cobblestone', amount: 100 },
    ];

    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    // Update user inventory
    if (reward.item === 'minecoins') {
      user.coins += reward.amount;
      message.reply(`🎉 You received **${reward.amount} Minecoins**!`);
    } else if (reward.item === 'diamond') {
      user.inventory.diamond += reward.amount;
      message.reply(`🎉 You received **${reward.amount} Diamond(s)**!`);
    } else if (reward.item === 'emerald') {
      user.inventory.emerald += reward.amount;
      message.reply(`🎉 You received **${reward.amount} Emerald(s)**!`);
    } else if (reward.item === 'boost') {
      user.boostExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      message.reply(`🎉 You received a **Super Pickaxe Boost** for 10 minutes!`);
    } else if (reward.item === 'lucky charm') {
      user.hasLuckyCharm = true;
      message.reply(`🎉 You received a **Lucky Charm**!`);
    } else if (reward.item === 'cobblestone') {
      user.inventory.cobblestone += reward.amount;
      message.reply(`🎉 You received **${reward.amount} Cobblestone**!`);
    }

    // Update lastDaily timestamp
    user.lastDaily = now;
    await user.save();
  }
};
