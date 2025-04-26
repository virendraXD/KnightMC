const User = require('../../models/user');

module.exports = {
  name: 'adoptpet',
  aliases: ['adopt', 'newpet'],
  description: 'Adopt a new pet if you have free slots!',
  
  async execute(message) {
    const userId = message.author.id;
    const user = await User.findOne({ userId });

    if (!user) {
      return message.reply("You need to start your journey first with `!mine`!");
    }

    const maxPetSlots = 2; // Starter users have 2 pet slots

    if (user.pets.length >= maxPetSlots) {
      return message.reply(`You already have ${maxPetSlots} pets! Abandon one with \`!abandonpet\` to adopt a new pet.`);
    }

    // List of possible pets
    const petTypes = ['Wolf', 'Horse', 'Axolotl', 'Fox', 'Cat', 'Dolphin'];

    const randomPet = petTypes[Math.floor(Math.random() * petTypes.length)];

    user.pets.push({
      type: randomPet,
      level: 1,
      experience: 0,
      isActive: false
    });

    await user.save();

    return message.reply(`🎉 You have adopted a **${randomPet}**! Take good care of your new friend!`);
  }
};
