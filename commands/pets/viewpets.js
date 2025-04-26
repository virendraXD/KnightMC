const { EmbedBuilder } = require('discord.js');
const User = require('../../models/user');

module.exports = {
  name: 'viewpets',
  aliases: ['mypets', 'pets'],
  description: 'View all your adopted pets and their status!',

  async execute(message) {
    const userId = message.author.id;
    const user = await User.findOne({ userId });

    if (!user) {
      return message.reply("You need to start your journey first with `!mine`!");
    }

    if (user.pets.length === 0) {
      return message.reply("You don't have any pets yet. Adopt one with `!adoptpet`!");
    }

    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Pets 🐾`)
      .setColor('#00C9FF')
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `You have ${user.pets.length}/2 pets.` });

    user.pets.forEach((pet, index) => {
      embed.addFields({
        name: `🐶 Pet #${index + 1}`,
        value: `**Type:** ${pet.type}\n**Level:** ${pet.level}\n**XP:** ${pet.experience}\n**Status:** ${pet.isActive ? '🟢 Active' : '⚪ Inactive'}`,
        inline: false
      });
    });

    message.channel.send({ embeds: [embed] });
  }
};
