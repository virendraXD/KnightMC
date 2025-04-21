require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// MongoDB connection
console.log('MONGO_URI:', process.env.MONGO_URI);
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
    level: { type: Number, default: 0 }
});
const XP = mongoose.model('XP', xpSchema);

// Quiz questions (from local file)
const fs = require('fs');
const quizQuestions = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));

const PORT = process.env.PORT || 3000;
const CHANNEL_ID = process.env.CHANNEL_ID;

app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('KnightMC is alive sir!');
});

// UptimeRobot route
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

// XP to level logic
function getLevel(xp) {
    return Math.floor(Math.sqrt(xp) / 10);
}

// Discord message handler
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // !ping
    if (message.content === '!ping') {
        return message.reply('🏓 Pong!');
    }

    // !rank
    if (message.content === '!rank') {
        const user = await XP.findOne({ userId: message.author.id });
        if (!user) {
            return message.reply("You don't have any XP yet.");
        }
        return message.reply(`**${message.author.username}** | Level: \`${user.level}\` | XP: \`${user.xp}\``);
    }

    // !top
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

    // !quiz
    if (message.content === '!quiz') {
        const quiz = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
        const optionsText = quiz.options.map((opt, index) => `**${index + 1}.** ${opt}`).join('\n');

        await message.channel.send(
            `🧠 **Minecraft Quiz**\n${quiz.question}\n\n${optionsText}\n\n_Reply with the option number (1-4)_`
        );

        const filter = m => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async collected => {
            const userAnswer = parseInt(collected.content);
            if (isNaN(userAnswer) || userAnswer < 1 || userAnswer > 4) {
                return message.channel.send("❌ Invalid answer. Please enter a number between 1 and 4.");
            }

            if (userAnswer - 1 === quiz.answer) {
                await message.channel.send(`✅ Correct, ${message.author}!`);
                let user = await XP.findOne({ userId: message.author.id });
                if (!user) user = new XP({ userId: message.author.id });
                user.xp += 10;
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

    // XP gain for regular messages
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

// Start Express server
app.listen(PORT, () => {
    console.log(`🚀 Web server running on port ${PORT}`);
});

// Discord bot login
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
