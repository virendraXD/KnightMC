require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const XP = require('./models/xp');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const prefix = config.prefix;
const OWNER_ID = process.env.OWNER_ID;
const PORT = process.env.PORT || 3000;
const CONSOLE_CHANNEL_ID = process.env.CONSOLE_CHANNEL_ID;
const SEND_SERVER_LOGS_TO_DM = process.env.SEND_SERVER_LOGS_TO_DM === 'true';

client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const commands = require(`./commands/${file}`);
    if (Array.isArray(commands)) {
        for (const command of commands) {
            if (command.name && command.execute) {
                client.commands.set(command.name, command);
                console.log(`✅ Loaded command: ${command.name}`);
            }
        }
    } else if (commands.name && commands.execute) {
        client.commands.set(commands.name, commands);
        console.log(`✅ Loaded command: ${commands.name}`);
    }
}

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected!'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
});

function getLevel(xp) {
    return Math.floor(Math.sqrt(xp) / 10);
}

// Express server
const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('KnightMC is alive!'));

app.post('/uptime-robot-webhook', async (req, res) => {
    const status = req.body.status;
    try {
        const channel = await client.channels.fetch(CONSOLE_CHANNEL_ID);
        if (status === 0) await channel.send('🚨 Service is DOWN!');
        else if (status === 1) await channel.send('✅ Service is UP!');
        res.status(200).send('Received');
    } catch (error) {
        console.error('Error sending status:', error);
        res.status(500).send('Error');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Web server running on port ${PORT}`);
});

// On bot ready
client.once('ready', async () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    try {
        if (OWNER_ID) {
            const owner = await client.users.fetch(OWNER_ID);
            await owner.send('✅ The bot is online!');
            console.log("✅ DM sent to owner.");
        } else {
            console.warn("⚠️ OWNER_ID is not defined.");
        }
    } catch (err) {
        console.error("❌ Failed to send DM to owner:", err);
    }
});

// Message handler
client.on('messageCreate', async (message) => {
    if (message.author.bot && message.channel.id !== CONSOLE_CHANNEL_ID) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);

        if (command) {
            // Fetch user XP data from MongoDB
            let userXp = await XP.findOne({ userId: message.author.id });

            if (!userXp) {
                userXp = new XP({
                    userId: message.author.id,
                    xp: 0,
                    level: 0
                });
                await userXp.save();
            }

            try {
                await command.execute(message, args, userXp);
            } catch (error) {
                console.error(`Error executing ${commandName}:`, error);
                message.reply("⚠️ There was an error trying to execute that command.");
            }
        }
    } else {
        // XP gain system
        let userXp = await XP.findOne({ userId: message.author.id });

        if (!userXp) {
            userXp = new XP({
                userId: message.author.id,
                xp: 0,
                level: 0
            });
        }

        const xpGain = Math.floor(Math.random() * 6) + 5;
        userXp.xp += xpGain;

        const newLevel = getLevel(userXp.xp);
        if (newLevel > userXp.level) {
            userXp.level = newLevel;
            message.channel.send(`🎉 GG ${message.author}, you leveled up to ${newLevel}!`);
        }

        await userXp.save(); // Save the updated XP to MongoDB
    }
});

client.login(process.env.DISCORD_TOKEN);
