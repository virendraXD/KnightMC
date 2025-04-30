const User = require('../../models/user'); // Assuming you have a User model

module.exports = {
  name: 'minecoin', // Command name
  aliases: ['coins', 'mc'], // Aliases for the command
  description: 'Check your Minecoin balance',

  async execute(message) {
    const userId = message.author.id;
    const user = await User.findOne({ userId });
    
    if (!user) {
      return message.reply("You need to use `!mine` first to create your inventory!");
    }

    // Retrieve the user's Mineminecoins
    const minecoins = user.minecoins;

    return message.reply(`💰 **Your Minecoin Balance**: ${minecoins} Minecoin(s)`);
  }
};
