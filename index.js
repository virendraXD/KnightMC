const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`KnightMC is online as ${client.user.tag}`);
  client.user.setActivity('your Minecraft server', { type: 'WATCHING' });
});

// Ping command
client.on('messageCreate', message => {
  if (message.author.bot) return;
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});

// Keep-alive server
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('KnightMC is alive buddy!'));
app.listen(3000, () => console.log('Web server is running.'));

client.login(process.env.TOKEN);
