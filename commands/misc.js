const XP = require('../xp.json');
const quizQuestions = require('../questions.json');
const { EmbedBuilder } = require('discord.js');

const usedQuestionIndexes = new Set();
const quizCooldown = new Set();

function getLevel(xp) {
  return Math.floor(Math.sqrt(xp) / 10);
}

module.exports = [
  {
    name: 'ping',
    description: 'Replies with pong!',
    async execute(message) {
      await message.reply('🏓 Pong!');
    }
  },
  {
    name: 'rank',
    description: 'Shows your XP and level',
    async execute(message) {
      const user = await XP.findOne({ userId: message.author.id });
      if (!user) return message.reply("You don't have any XP yet.");
      return message.reply(`**${message.author.username}** | Level: \`${user.level}\` | XP: \`${user.xp}\``);
    }
  },
  {
    name: 'quiz',
    description: 'Minecraft quiz challenge',
    async execute(message) {
      if (quizCooldown.has(message.author.id)) {
        return message.reply("⏳ Please wait before starting another quiz!");
      }
      quizCooldown.add(message.author.id);
      setTimeout(() => quizCooldown.delete(message.author.id), 5000);

      if (usedQuestionIndexes.size === quizQuestions.length) {
        usedQuestionIndexes.clear();
      }

      let index;
      do {
        index = Math.floor(Math.random() * quizQuestions.length);
      } while (usedQuestionIndexes.has(index));

      usedQuestionIndexes.add(index);
      const quiz = quizQuestions[index];
      const optionsText = quiz.options.map((opt, i) => `**${i + 1}.** ${opt}`).join('\n');

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setAuthor({
          name: 'Minecraft Quiz Challenge',
          iconURL: 'https://cdn.discordapp.com/emojis/1364220323221737606.png'
        })
        .setDescription(`**${quiz.question}**\n\n${optionsText}\n\n_Reply with the option number (1–4)_`)
        .setFooter({ text: `You have 15 seconds to answer!` });

      await message.channel.send({ embeds: [embed] });

      const filter = m => m.author.id === message.author.id;
      const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

      collector.on('collect', async (collected) => {
        const userAnswer = parseInt(collected.content);
        if (isNaN(userAnswer) || userAnswer < 1 || userAnswer > 4) {
          return message.channel.send("❌ Invalid answer. Please enter a number between 1 and 4.");
        }

        if (userAnswer - 1 === quiz.answer) {
          await message.channel.send(`✅ Correct, ${message.author} you gained 100 XP.`);
          let user = await XP.findOne({ userId: message.author.id });
          if (!user) user = new XP({ userId: message.author.id });
          user.xp += 100;
          const newLevel = getLevel(user.xp);
          if (newLevel > user.level) {
            user.level = newLevel;
            await message.channel.send(`🎉 GG ${message.author}, you leveled up to ${newLevel}!`);
          }
          await user.save();
        } else {
          await message.channel.send(`❌ Wrong! The correct answer was **${quiz.options[quiz.answer]}**.`);
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          message.channel.send("⏰ Time's up! You didn't answer.");
        }
      });
    }
  }
];
