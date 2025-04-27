module.exports = {
    name: 'addtrade',
    description: 'Add items or coins to the trade',
    async execute(message, args) {
      const trade = message.client.trades.get(message.author.id);
      if (!trade) return message.reply("You haven't started a trade yet!");
  
      const item = args.join(' ');
      if (!item) return message.reply("Please specify an item or amount of coins to add!");
  
      // Example: Check if the user has the item or coins
      if (message.author.inventory[item]) {
        trade.items.push(item);
        message.author.inventory[item] -= 1;
        return message.reply(`You added 1 ${item} to the trade.`);
      } else if (item === "coins") {
        trade.coins += 10; // For example, adding 10 coins
        message.author.coins -= 10;
        return message.reply(`You added 10 coins to the trade.`);
      } else {
        return message.reply("You don't have that item!");
      }
    },
  };
  