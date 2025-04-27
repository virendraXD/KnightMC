module.exports = {
    name: 'confirmtrade',
    description: 'Confirm the trade',
    async execute(message) {
      const trade = message.client.trades.get(message.author.id);
      if (!trade) return message.reply("You haven't started a trade yet!");
  
      const targetUser = message.client.users.cache.get(trade.targetUserId);
      if (!targetUser) return message.reply("The target user is not available.");
  
      // Check the other user for their confirmation, and if they agree, proceed with trade
      const targetTrade = message.client.trades.get(targetUser.id);
      if (!targetTrade) return message.reply(`${targetUser.username} hasn't initiated the trade`);
  
      // Execute trade
      message.client.users.cache.get(trade.targetUserId).inventory.push(...trade.items);
      message.client.users.cache.get(trade.targetUserId).coins += trade.coins;
  
      // Notify both players
      message.reply(`You and ${targetUser.username} successfully traded items/coins!`);
      targetUser.send(`You and ${message.author.username} successfully traded items/coins!`);
  
      // Clear trade data
      message.client.trades.delete(message.author.id);
      message.client.trades.delete(targetUser.id);
    },
  };
  