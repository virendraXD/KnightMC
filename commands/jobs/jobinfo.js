const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'jobinfo',
  aliases: ['jobs', 'joblist'],
  description: 'View information about available jobs',

  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('💼 Available Jobs')
      .setDescription('Choose a job wisely! Each job gives special bonuses.')
      .addFields(
        { 
          name: '⛏️ Miner', 
          value: '• Higher chance to find rare ores\n• 10% more cobblestone per mine\n• Slightly reduced mining cooldown' 
        },
        { 
          name: '⚒️ Blacksmith', 
          value: '• Chance to double Minecoins earned\n• Increased durability of special boosts\n• Rarely find enchanted items' 
        },
        { 
          name: '🏴‍☠️ Treasure Hunter', 
          value: '• Random bonus items while mining\n• Higher chance to find emeralds and treasures\n• Luck boost during events' 
        }
      )
      .setFooter({ text: 'Use !choosejob <job name> to select your career!' });

    return message.reply({ embeds: [embed] });
  }
};
