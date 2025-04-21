const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const quizQuestions = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PORT = process.env.PORT || 3000;
const CHANNEL_ID = process.env.CHANNEL_ID;

app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send('KnightMC is alive!');
});

// UptimeRobot webhook
app.post('/uptime-robot-webhook', async (req, res) => {
    const status = req.body.status;
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);

        if (status === 0) {
            await channel.send('🚨 The monitored service is DOWN!');
        } else if (status === 1) {
            await channel.send('✅ The monitored service is UP!');
        }

        res.status(200).send('Received');
    } catch (error) {
        console.error('Error sending message to Discord channel:', error);
        res.status(500).send('Error');
    }
});

// XP System Functions
function loadXP() {
    if (!fs.existsSync('xp.json')) fs.writeFileSync('xp.json', '{}');
    return JSON.parse(fs.readFileSync('xp.json', 'utf8'));
}

function saveXP(data) {
    fs.writeFileSync('xp.json', JSON.stringify(data, null, 2));
}

function getLevel(xp) {
    return Math.floor(Math.sqrt(xp) / 10);
}

// Message handler
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const xpData = loadXP();
    const userId = message.author.id;

    // !ping command
    if (message.content === '!ping') {
        return message.reply('Pong!');
    }

    // !rank command
    if (message.content === '!rank') {
        const user = xpData[userId] || { xp: 0, level: 0 };
        return message.reply(`**${message.author.username}** | Level: \`${user.level}\` | XP: \`${user.xp}\``);
    }

    // !top command
    if (message.content === '!top') {
        const leaderboard = Object.entries(xpData)
            .map(([id, data]) => ({
                id,
                xp: data.xp,
                level: data.level
            }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 5);

        const formatted = await Promise.all(
            leaderboard.map(async (user, i) => {
                try {
                    const member = await message.guild.members.fetch(user.id);
                    return `#${i + 1} — **${member.user.username}** | Level: ${user.level}, XP: ${user.xp}`;
                } catch {
                    return `#${i + 1} — Unknown User | Level: ${user.level}, XP: ${user.xp}`;
                }
            })
        );

        return message.channel.send(`**XP Leaderboard**\n${formatted.join('\n')}`);
    }

    // !quiz command
    if (message.content === '!quiz') {
        const quiz = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
        let optionsText = quiz.options.map((opt, index) => `**${index + 1}.** ${opt}`).join('\n');

        await message.channel.send(
            `**Minecraft Quiz:**\n${quiz.question}\n\n${optionsText}\n\n_Reply with the option number (1-4)_`
        );

        const filter = m => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', collected => {
            const userAnswer = parseInt(collected.content);
            if (isNaN(userAnswer) || userAnswer < 1 || userAnswer > 4) {
                return message.channel.send("Invalid answer! Please enter a number between 1 and 4.");
            }

            if (userAnswer - 1 === quiz.answer) {
                message.channel.send(`✅ Correct, ${message.author}!`);
            } else {
                message.channel.send(`❌ Wrong! The correct answer was **${quiz.options[quiz.answer]}**.`);
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.channel.send("⏰ Time's up! You didn't answer in time.");
            }
        });
    }

    // XP Gain
    if (!xpData[userId]) {
        xpData[userId] = { xp: 0, level: 0 };
    }

    const xpGain = Math.floor(Math.random() * 6) + 5; // Random XP between 5–10
    xpData[userId].xp += xpGain;

    const newLevel = getLevel(xpData[userId].xp);

    if (newLevel > xpData[userId].level) {
        xpData[userId].level = newLevel;
        await message.channel.send(`**GG ${message.author}, you leveled up to ${newLevel}!**`);
    }

    saveXP(xpData);
});

// Error logging
process.on('unhandledRejection', console.error);

// Start Express server
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

// Login Discord bot
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
