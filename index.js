const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('KnightMC is alive!'));
app.listen(3000, () => console.log('Web server running!'));

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const PORT = process.env.PORT || 3000;
const CHANNEL_ID = process.env.CHANNEL_ID;

app.use(express.json());

app.post('/uptime-robot-webhook', async (req, res) => {
    const status = req.body.status;
    const channel = await client.channels.fetch(CHANNEL_ID);
    
    if (status === 0) {
        channel.send('🚨 The monitored service is DOWN!');
    } else if (status === 1) {
        channel.send('✅ The monitored service is UP!');
    }

    res.status(200).send('Received');
});

app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
