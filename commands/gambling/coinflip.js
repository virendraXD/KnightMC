const User = require('../../models/user');
const cooldowns = new Map(); // In-memory cooldown tracker

module.exports = {
    name: 'coinflip',
    aliases: ['cf'],
    description: 'Gamble your Minecoins OwO-style!',
    usage: '!coinflip <amount>',
  async execute(message, args) {
    const amount = parseInt(args[0]);
    const userId = message.author.id;

    // ✅ Input validation
    if (isNaN(amount) || amount <= 0) {
      return message.reply('❗ You must bet a positive number of Minecoins.\nExample: `!coinflip 100`');
    }

    if (amount > 200000) {
      return message.reply('❗ Max bet is 200,000 Minecoins.');
    }

    // 🕒 Cooldown check
    const cooldown = cooldowns.get(userId);
    if (cooldown && Date.now() - cooldown < 10000) {
      const remaining = ((10000 - (Date.now() - cooldown)) / 1000).toFixed(1);
      return message.reply(`⏳ Please wait ${remaining}s before flipping again.`);
    }

    cooldowns.set(userId, Date.now());

    // 🧾 Load or create user
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, minecoins: 0 });
    }

    if (user.minecoins < amount) {
      return message.reply(`❌ You don’t have enough Minecoins! Your balance: **${user.minecoins}**`);
    }

    // 🪙 Animation step 1
    const flipMsg = await message.reply('🪙 Flipping the coin.');

    // Animate 🪙
    const animation = ['🪙 Flipping the coin.', '🪙 Flipping the coin..', '🪙 Flipping the coin...'];
    let i = 0;
    const interval = setInterval(() => {
      flipMsg.edit(animation[i % animation.length]);
      i++;
    }, 500);

    // Wait 2 seconds then resolve flip
    setTimeout(async () => {
      clearInterval(interval);

      const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
      const win = Math.random() < 0.5;

      let resultMsg = '';
      if (win) {
        user.minecoins += amount;
        resultMsg = `🎉 The coin landed on **${outcome}**!\nYou **won** +${amount} Minecoins!\n💰 New balance: **${user.minecoins}**`;
      } else {
        user.minecoins -= amount;
        resultMsg = `😢 The coin landed on **${outcome}**!\nYou **lost** -${amount} Minecoins.\n💸 New balance: **${user.minecoins}**`;
      }

      await user.save();
      flipMsg.edit(resultMsg);
    }, 2000);
  },
};
