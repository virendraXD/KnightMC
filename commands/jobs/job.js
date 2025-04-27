const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'job',
  aliases: ['jobs', 'joblist'],
  description: 'View all available jobs you can choose',
  
  async execute(message) {
    const jobs = [
      {
        name: '⛏️ Miner',
        description: 'Earn bonus ores while mining (+20% chance for extra ores).',
      },
      {
        name: '⚒️ Blacksmith',
        description: 'Earn passive Minecoins every hour (+5 coins/hour).',
      },
      {
        name: '🏴‍☠️ Treasure Hunter',
        description: 'Chance to find rare items while mining (+Emeralds, +Loot).',
      },
    ];

    const embed = new EmbedBuilder()
      .setTitle('🏆 Available Jobs')
      .setColor('#00ccff')
      .setDescription('Choose a job wisely! Jobs give you passive bonuses and special rewards.')
      .addFields(
        jobs.map(job => ({
          name: job.name,
          value: job.description,
          inline: false,
        }))
      )
      .setFooter({ text: 'Use !choosejob to select a job!' });

    return message.reply({ embeds: [embed] });
  }
};
