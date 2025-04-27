const { EmbedBuilder } = require('discord.js');
const User = require('../models/user');
const Pet = require('../models/pet');
const XP = require('../models/XP'); // XP should be lowercase filename

module.exports = {
  name: 'profile',
  aliases: ['stats', 'userinfo'],
  description: 'View your profile and stats',

  async execute(message) {
    const userId = message.author.id;

    // Fetch data
    const user = await User.findOne({ userId });
    const userXp = await XP.findOne({ userId });
    const pets = await Pet.find({ ownerId: userId });

    if (!user) {
      return message.reply("You need to use `!mine` to create your inventory first!");
    }

    const level = userXp ? userXp.level : 1;
    const exp = userXp ? userXp.exp : 0;
    const minecoins = user.coins || 0;

    const petList = pets.length > 0
      ? pets.map(pet => `**${pet.name}** - ${pet.type} | ❤️ ${pet.health}`).join('\n')
      : 'No pets adopted yet.';

    // Create embed
    const profileEmbed = new EmbedBuilder()
      .setColor('#00b0f4')
      .setTitle(`📜 ${message.author.username}'s Profile`)
      .addFields(
        { name: '🏅 Level', value: `${level}`, inline: true },
        { name: '✨ XP', value: `${exp}`, inline: true },
        { name: '💰 Minecoins', value: `${minecoins}`, inline: true },
        { name: '🐾 Pets', value: petList, inline: false }
      )
      .setFooter({ text: 'KnightMC | Use !help for commands' })
      .setThumbnail(message.author.displayAvatarURL());

    return message.reply({ embeds: [profileEmbed] });
  }
};
