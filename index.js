const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const PORT = process.env.PORT || 3000;
const CHANNEL_ID = process.env.CHANNEL_ID;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('KnightMC is alive!');
});

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

app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
