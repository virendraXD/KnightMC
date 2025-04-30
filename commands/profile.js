const { EmbedBuilder } = require('discord.js');
const User = require('../models/user');
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

    if (!user) {
      return message.reply("You need to use `!mine` to create your inventory first!");
    }

    const level = userXp ? userXp.level : 1;
    const xp = userXp ? userXp.xp : 0;
    const minecoins = user.minecoins || 0;

    // Check if the user has a pet inside the user model
    const petList = user.pets && user.pets.length > 0
    ? user.pets.map(pet => `**${pet.type}** - Level ${pet.level} | XP: ${pet.experience} | Active: ${pet.isActive ? '✅' : '❌'}`).join('\n')
    : 'No pets adopted yet.';

    // Create embed
    const profileEmbed = new EmbedBuilder()
      .setColor('#00b0f4')
      .setTitle(`📜 ${message.author.username}'s Profile`)
      .addFields(
        { name: '🏅 Level', value: `${level}`, inline: true },
        { name: '✨ XP', value: `${xp}`, inline: true },
        { name: '💰 Minecoins', value: `${minecoins}`, inline: true },
        { name: '🐾 Pets', value: petList, inline: false }
      )
      .setFooter({ text: 'KnightMC | Use !help for commands' })
      .setThumbnail(message.author.displayAvatarURL());

    return message.reply({ embeds: [profileEmbed] });
  }
};
