const { EmbedBuilder } = require('discord.js');
const User = require('../../models/user'); // Assuming you store user's job in user model

module.exports = {
  name: 'choosejob',
  aliases: ['selectjob', 'pickjob'],
  description: 'Choose your job: Miner, Blacksmith, or Treasure Hunter!',

  async execute(message, args) {
    const userId = message.author.id;
    const jobName = args.join(' ').toLowerCase();

    const availableJobs = {
      miner: '⛏️ Miner',
      blacksmith: '⚒️ Blacksmith',
      'treasure hunter': '🏴‍☠️ Treasure Hunter'
    };

    if (!jobName || !availableJobs[jobName]) {
      return message.reply(`Please choose a valid job: Miner, Blacksmith, or Treasure Hunter.\nExample: \`!choosejob Miner\``);
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return message.reply("You need to create your account first by using `!mine`.");
    }

    if (user.job) {
      return message.reply(`You already have a job: **${user.job}**! (Job changing will be allowed later)`);
    }

    user.job = availableJobs[jobName];
    await user.save();

    const embed = new EmbedBuilder()
      .setColor('#00ff99')
      .setTitle('🎉 Job Selected!')
      .setDescription(`You have successfully chosen the job: **${availableJobs[jobName]}**!\nGet ready for bonuses while mining!`)
      .setFooter({ text: 'Work hard and earn rewards!' });

    return message.reply({ embeds: [embed] });
  }
};
