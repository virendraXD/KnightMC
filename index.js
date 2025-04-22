require('dotenv').config(); // Load secrets from Replit Secrets tab
const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const quizCooldown = new Set();

// Add at the top with other declarations
const usedQuestionIndexes = new Set();



const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Debugging: Print MONGO_URI to check if it's loaded
if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is undefined! Check your Replit secrets.");
    process.exit(1);
} else {
    console.log('🔍 MONGO_URI loaded successfully.');
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB Connected!'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

// MongoDB XP schema
const xpSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    // Add in MongoDB schema
    streak: { type: Number, default: 0 },
    // Store `lastClaimed` date in user schema
    lastDaily: { type: Date }

});
const XP = mongoose.model('XP', xpSchema);

// Quiz questions
const quizQuestions = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));

const PORT = process.env.PORT || 3000;
const CHANNEL_ID = process.env.CHANNEL_ID;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('KnightMC is alive sir!');
});

app.post('/uptime-robot-webhook', async (req, res) => {
    const status = req.body.status;
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (status === 0) await channel.send('🚨 Service is DOWN!');
        else if (status === 1) await channel.send('✅ Service is UP!');
        res.status(200).send('Received');
    } catch (error) {
        console.error('Error sending status:', error);
        res.status(500).send('Error');
    }
});

function getLevel(xp) {
    return Math.floor(Math.sqrt(xp) / 10);
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping') return message.reply('🏓 Pong!');

    if (message.content === '!rank') {
        const user = await XP.findOne({ userId: message.author.id });
        if (!user) return message.reply("You don't have any XP yet.");
        return message.reply(`**${message.author.username}** | Level: \`${user.level}\` | XP: \`${user.xp}\``);
    }

    if (message.content === '!top') {
        const leaderboard = await XP.find().sort({ xp: -1 }).limit(5);
        const formatted = await Promise.all(leaderboard.map(async (user, i) => {
            try {
                const member = await message.guild.members.fetch(user.userId);
                return `#${i + 1} — **${member.user.username}** | Level: ${user.level}, XP: ${user.xp}`;
            } catch {
                return `#${i + 1} — Unknown User | Level: ${user.level}, XP: ${user.xp}`;
            }
        }));
        return message.channel.send(`**🏆 XP Leaderboard**\n${formatted.join('\n')}`);
    }

if (message.content === '!quiz') {
    if (quizCooldown.has(message.author.id)) {
        return message.reply("⏳ Please wait before starting another quiz!");
    }
    quizCooldown.add(message.author.id);
    setTimeout(() => quizCooldown.delete(message.author.id), 5000); // 5s cooldown

    if (usedQuestionIndexes.size === quizQuestions.length) {
        usedQuestionIndexes.clear(); // Reset when all questions used
    }

    let index;
    do {
        index = Math.floor(Math.random() * quizQuestions.length);
    } while (usedQuestionIndexes.has(index));

    usedQuestionIndexes.add(index);
    const quiz = quizQuestions[index];
    const optionsText = quiz.options.map((opt, i) => `**${i + 1}.** ${opt}`).join('\n');

    const embed = new EmbedBuilder()
        .setColor('#00ff00') // Green stripe on the side
        .setAuthor({ 
            name: 'Minecraft Quiz Challenge',
            iconURL: 'https://cdn.discordapp.com/emojis/1364220323221737606.png'
        })

        .setDescription(`**${quiz.question}**\n\n${optionsText}\n\n_Reply with the option number (1–4)_`)
        .setFooter({ text: `You have 15 seconds to answer!` });

    await message.channel.send({ embeds: [embed] });

    const filter = m => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

    collector.on('collect', async collected => {
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

    return;
}

    // XP for regular messages
    let user = await XP.findOne({ userId: message.author.id });
    if (!user) user = new XP({ userId: message.author.id });

    const xpGain = Math.floor(Math.random() * 6) + 5;
    user.xp += xpGain;
    const newLevel = getLevel(user.xp);

    if (newLevel > user.level) {
        user.level = newLevel;
        await message.channel.send(`🎉 GG ${message.author}, you leveled up to ${newLevel}!`);
    }

    await user.save();
});

// Express server
app.listen(PORT, () => {
    console.log(`🚀 Web server running on port ${PORT}`);
});

// Discord bot login
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
