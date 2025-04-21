const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// MongoDB Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected!'))
    .catch(err => console.log(err));

// Define MongoDB Schema
const xpSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 }
});

const XP = mongoose.model('XP', xpSchema);

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

// Get level based on XP
function getLevel(xp) {
    return Math.floor(Math.sqrt(xp) / 10);
}

// Message handler
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // !ping command
    if (message.content === '!ping') {
        return message.reply('Pong!');
    }

    // !rank command
    if (message.content === '!rank') {
        const user = await XP.findOne({ userId: message.author.id });
        if (!user) {
            return message.reply("You don't have any XP yet.");
        }

        return message.reply(`**${message.author.username}** | Level: \`${user.level}\` | XP: \`${user.xp}\``);
    }

    // !top command
    if (message.content === '!top') {
        const leaderboard = await XP.find().sort({ xp: -1 }).limit(5);
        const formatted = leaderboard.map((user, i) => {
            return `#${i + 1} — **${user.userId}** | Level: ${user.level}, XP: ${user.xp}`;
        });

        return message.channel.send(`**XP Leaderboard**\n${formatted.join('\n')}`);
    }

    // Handle XP gain
    let user = await XP.findOne({ userId: message.author.id });

    if (!user) {
        user = new XP({ userId: message.author.id });
    }

    const xpGain = Math.floor(Math.random() * 6) + 5; // Random XP between 5–10
    user.xp += xpGain;

    const newLevel = getLevel(user.xp);
    if (newLevel > user.level) {
        user.level = newLevel;
        await message.channel.send(`**GG ${message.author}, you leveled up to ${newLevel}!**`);
    }

    await user.save();
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
