const User = require('../../models/user');

module.exports = {
  name: 'abandonpet',
  aliases: ['releasepet', 'deletepet'],
  description: 'Abandon a pet you no longer want.',

  async execute(message, args) {
    const userId = message.author.id;
    const user = await User.findOne({ userId });

    if (!user) {
      return message.reply("You need to start your journey first with `!mine`!");
    }

    if (user.pets.length === 0) {
      return message.reply("You don't have any pets to abandon!");
    }

    const petIndex = parseInt(args[0], 10) - 1; // User inputs pet number (1,2,...)

    if (isNaN(petIndex) || petIndex < 0 || petIndex >= user.pets.length) {
      return message.reply(`Please provide a valid pet number! Example: \`!abandonpet 1\``);
    }

    const abandonedPet = user.pets.splice(petIndex, 1)[0];
    await user.save();

    return message.reply(`💔 You have abandoned your **${abandonedPet.type}**.`);
  }
};
