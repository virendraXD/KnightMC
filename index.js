require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, Events } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const XP = require('./models/XP');
const Pets = require('./models/pet');
const User = require('./models/user');
const Inventory = require('./commands/minecraft/inventory');
const config = require('./config.json');

// Global Emojis
const emojisToUpload = [
  { name: 'cobblestone', url: 'https://cdn.discordapp.com/emojis/1365620149079773215.png' },
  { name: 'coal', url: 'https://cdn.discordapp.com/emojis/1365620139734728745.png' },
  { name: 'iron', url: 'https://cdn.discordapp.com/emojis/1365620151722049567.png' },
  { name: 'diamond', url: 'https://cdn.discordapp.com/emojis/1365620142574407780.png' },
  { name: 'emerald', url: 'https://cdn.discordapp.com/emojis/1365620154628833300.png' },
  { name: 'grass', url: 'https://cdn.discordapp.com/emojis/1364220323221737606.png' }
];

module.exports.emojisToUpload = emojisToUpload;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const prefix = config.prefix;
const OWNER_ID = process.env.OWNER_ID;
const PORT = process.env.PORT || 3000;
const CONSOLE_CHANNEL_ID = process.env.CONSOLE_CHANNEL_ID;
const SEND_SERVER_LOGS_TO_DM = process.env.SEND_SERVER_LOGS_TO_DM === 'true';

client.commands = new Collection();

function loadCommands(dir, client) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      loadCommands(fullPath, client);
    } else if (file.endsWith('.js')) {
      const commands = require(fullPath);
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
  }
}
loadCommands(path.join(__dirname, 'commands'), client);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

function getLevel(xp) {
  return Math.floor(Math.sqrt(xp) / 10);
}

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

app.listen(PORT, () => console.log(`🚀 Web server running on port ${PORT}`));

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

client.on('messageCreate', async (message) => {
  if (message.author.bot && message.channel.id !== CONSOLE_CHANNEL_ID) return;

  if (message.channel.id === CONSOLE_CHANNEL_ID) {
    const rawContent = message.content
      .replace(/```diff/g, '')
      .replace(/```/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (rawContent.includes('essentials')) {
      try {
        const guild = message.guild || await client.guilds.fetch(process.env.GUILD_ID);
        const role = guild.roles.cache.find(r => r.name === "Smp log");
        if (!role) return;

        for (const [, member] of role.members) {
          try {
            await member.send('✅ Minecraft server has started!');
          } catch (err) {
            console.error(`Failed to DM ${member.user.tag}:`, err);
          }
        }
      } catch (error) {
        console.error("Error notifying Smp log roles:", error);
      }
    }
  }

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    let userXp = await XP.findOne({ userId: message.author.id }) || new XP({ userId: message.author.id, xp: 0, level: 0 });

    if (command) {
      try {
        await command.execute(message, args, userXp);
      } catch (error) {
        console.error(`Error executing ${commandName}:`, error);
        message.reply("⚠️ Error executing command.");
      }
    }
  } else {
    let userXp = await XP.findOne({ userId: message.author.id }) || new XP({ userId: message.author.id, xp: 0, level: 0 });
    const xpGain = Math.floor(Math.random() * 6) + 5;
    userXp.xp += xpGain;

    const newLevel = getLevel(userXp.xp);
    if (newLevel > userXp.level) {
      userXp.level = newLevel;
      message.channel.send(`🎉 GG ${message.author}, you leveled up to ${newLevel}!`);
    }

    await userXp.save();
  }

  if (message.author.bot) return;

  if (message.content === '!help') {
    return message.channel.send(`
**KnightMC Bot Commands:**
\`!help\`, \`!info\`, \`!ping\`, \`!rank\`, \`!profile\`, \`!pets\`, \`!adoptpet\`, \`!petinfo\`,
\`!abandonpet\`, \`!quiz\`, \`!mine\`, \`!inventory\`, \`!shop\`, \`!buy\`, \`!sell\`,
\`!dailychest\`, \`!minecoin\`, \`jobs\`, \`jobinfo\`, \`choosejob\`, \`viewtrade\`, \`trade\`
    `);
  }

  if (message.content === '!info') {
    return message.channel.send(`
**KnightMC Bot Info:**
- Developed by KnightGost
- Version: 1.0.0
- Minecraft XP, Economy, Quiz, and Console Monitoring
    `);
  }
});

client.on('guildCreate', async (guild) => {
  try {
    for (const emoji of emojisToUpload) {
      const existing = guild.emojis.cache.find(e => e.name === emoji.name);
      if (!existing) {
        await guild.emojis.create({ attachment: emoji.url, name: emoji.name });
      }
    }
  } catch (err) {
    console.error("Error uploading emojis:", err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return;
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: '❌ You are not authorized.', ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId.startsWith('edit_')) {
    const [_, field, userId] = interaction.customId.split('_');
    const modal = new ModalBuilder().setCustomId(`submit_${field}_${userId}`).setTitle(`Edit ${field.toUpperCase()}`);
    const input = new TextInputBuilder()
      .setCustomId(`new_${field}`)
      .setLabel(`Enter new ${field}`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (interaction.isButton() && interaction.customId.startsWith('view_')) {
    const [_, field, userId] = interaction.customId.split('_');
    if (field === 'inventory') {
      const data = await Inventory.findOne({ userId }) || { items: [] };
      const content = data.items.map(item => `• ${item.name} x${item.quantity}`).join('\n') || '📦 Empty inventory.';
      const embed = new EmbedBuilder().setTitle(`📦 Inventory: <@${userId}>`).setDescription(content).setColor('Blue');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (field === 'pets') {
      const data = await Pets.findOne({ userId }) || { pets: [] };
      const content = data.pets.map(p => `🐾 ${p.name} (${p.type})`).join('\n') || '🐾 No pets adopted.';
      const embed = new EmbedBuilder().setTitle(`🐾 Pets: <@${userId}>`).setDescription(content).setColor('Green');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  if (interaction.isModalSubmit()) {
    const [_, field, userId] = interaction.customId.split('_');
    const newValue = parseInt(interaction.fields.getTextInputValue(`new_${field}`));
    if (isNaN(newValue)) {
      return interaction.reply({ content: '❌ Invalid number.', ephemeral: true });
    }

    if (field === 'minecoins') {
      let user = await User.findOne({ userId }) || new User({ userId, minecoins: 0 });
      user.minecoins = newValue;
      await user.save();
    } else {
      let userXp = await XP.findOne({ userId }) || new XP({ userId, xp: 0, level: 0 });
      if (field === 'xp') userXp.xp = newValue;
      if (field === 'level') userXp.level = newValue;
      await userXp.save();
    }

    return interaction.reply({ content: `✅ Updated \`${field}\` for <@${userId}> to \`${newValue}\`.`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
