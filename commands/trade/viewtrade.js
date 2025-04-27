module.exports = {
    name: 'viewtrade',
    description: 'View the current trade items',
    async execute(message) {
      const trade = message.client.trades.get(message.author.id);
      if (!trade) return message.reply("You have no ongoing trade.");
  
      return message.reply(`You are trading: ${trade.items.join(', ')} and ${trade.coins} coins.`);
    },
  };
  