const { MessageEmbed } = require('discord.js');
const User = require('../../models/user');
const Trade = require('../../models/trade'); // Assuming trade schema exists

module.exports = {
  name: 'trade',
  description: 'Trade items with another user',

  async execute(message, args) {
    try {
      const targetUser = message.mentions.users.first();
      if (!targetUser) return message.reply('Please mention a user to trade with.');

      const tradeItems = args.slice(1);
      if (tradeItems.length < 2) return message.reply('Please provide item(s) and quantity.');

      const [item1, quantity1, item2, quantity2] = tradeItems;
      const user = await User.findOne({ userId: message.author.id });
      const target = await User.findOne({ userId: targetUser.id });

      if (!user || !target) {
        return message.reply('One or both users do not exist in the database.');
      }

      // Check if the user has enough items
      if (!user.inventory[item1] || user.inventory[item1] < parseInt(quantity1)) {
        return message.reply(`You don't have enough ${item1} to trade.`);
      }

      if (!target.inventory[item2] || target.inventory[item2] < parseInt(quantity2)) {
        return message.reply(`${targetUser.username} doesn't have enough ${item2} to trade.`);
      }

      // Execute the trade: update both users' inventories
      user.inventory[item1] -= parseInt(quantity1);
      target.inventory[item2] -= parseInt(quantity2);
      
      if (!user.inventory[item2]) user.inventory[item2] = 0;
      if (!target.inventory[item1]) target.inventory[item1] = 0;

      user.inventory[item2] += parseInt(quantity2);
      target.inventory[item1] += parseInt(quantity1);

      // Save the updated user and target data
      await user.save();
      await target.save();

      const tradeEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Trade Successful!')
        .setDescription(`${message.author.username} traded **${quantity1} ${item1}** with **${quantity2} ${item2}** to ${targetUser.username}.`);

      message.channel.send({ embeds: [tradeEmbed] });

    } catch (error) {
      console.error('Trade command error:', error);
      message.reply('An error occurred while processing the trade.');
    }
  }
};
