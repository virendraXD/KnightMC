require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const XP = require('./models/XP');
const config = require('./config.json');

// Declare emojis globally
const emojisToUpload = [
  { name: 'cobblestone', url: 'https://cdn.discordapp.com/emojis/1365620149079773215.png' },
  { name: 'coal', url: 'https://cdn.discordapp.com/emojis/1365620139734728745.png' },
  { name: 'iron', url: 'https://cdn.discordapp.com/emojis/1365620151722049567.png' },
  { name: 'diamond', url: 'https://cdn.discordapp.com/emojis/1365620142574407780.png' },
  { name: 'emerald', url: 'https://cdn.discordapp.com/emojis/1365620154628833300.png' },
  { name: 'grass', url: 'https://cdn.discordapp.com/emojis/1364220323221737606.png' }
];

// Export for other files
module.exports.emojisToUpload = emojisToUpload;

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

// A function to recursively read all command files
function loadCommands(dir, client) {
    const files = fs.readdirSync(dir);
  
    for (const file of files) {
      const fullPath = path.join(dir, file);
  
      if (fs.lstatSync(fullPath).isDirectory()) {
        loadCommands(fullPath, client); // recursion for folders
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

// Usage
loadCommands(path.join(__dirname, 'commands'), client);

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

    console.log("Incoming Message:", message.content);

    if (message.channel.id === CONSOLE_CHANNEL_ID) {
        console.log("Message is from the console channel");

        const rawContent = message.content
            .replace(/```diff/g, '')
            .replace(/```/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

        console.log("Processed Console Message:", rawContent);

        if (rawContent.includes('essentials')) {
            console.log("Found the word 'essentials' in the message!");

            try {
                // Fetch the guild (server) from the message
                const guild = message.guild || await client.guilds.fetch(YOUR_GUILD_ID);

                // Fetch the role by name or ID
                const role = guild.roles.cache.find(r => r.name === "SMP Member");
                if (!role) {
                    console.error("Role 'SMP Member' not found!");
                    return;
                }

                // Get all members who have the role
                const membersWithRole = role.members;

                for (const [memberId, member] of membersWithRole) {
                    try {
                        await member.send('✅ Minecraft server has started!');
                        console.log(`DM sent to ${member.user.username}`);
                    } catch (err) {
                        console.error(`Failed to DM ${member.user.tag}:`, err);
                    }
                }

            } catch (error) {
                console.error("Error fetching guild or sending DMs:", error);
            }
        }
    }

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
    
    // Don't respond to bot messages (except console channel case you already handle above)
    if (message.author.bot) return;
    
    // Help Command
    if (message.content === '!help') {
        return message.channel.send(`
    **KnightMC Bot Commands:**
    \`!help\` — Show this help menu.
    \`!info\` — Show bot info.
    \`!ping\` — Check bot latency.
    \`!rank\` — See your XP and level.
    \`!profile\` — View your profile and stats.
    \`!pets\` — View your pets.
    \`!adoptpet\` — Adopt a pet.
    \`!petinfo\` — Get info about your pet.
    \`!abandonpet\` — Free your pet.
    \`!quiz\` — Play a Minecraft quiz to earn XP.
    \`!mine\` — Mine for resources and earn XP.
    \`!inventory\` — Check your inventory.
    \`!shop\` — View available upgrades.
    \`!buy\` - Buy an upgrade.
    \`!sell\` — Sell your resources for coins.
    \`!dailychest\` — Claim your daily reward.
    \`!minecoin\` — Check your coin balance.
    \`jobs\` — View available jobs.
    \`jobinfo\` — Get info about you accepted job.
    \`choosejob\` — Choose a job to earn buffs.
    \`viewtrade\` — View your trades.
    \`trade\` — Trade items with another user.
        `);
    }
    
    // Info Command
    if (message.content === '!info') {
        return message.channel.send(`
    **KnightMC Bot Info:**
    - Developed by KnightGost
    - Version: 1.0.0
    - Features: Minecraft themed game, Minecraft quiz, XP System, Server Console Monitoring
        `);
    }

});

client.on('guildCreate', async (guild) => {
    try {
        console.log(`Joined new server: ${guild.name}`);
  
        for (const emoji of emojisToUpload) {
            const existing = guild.emojis.cache.find(e => e.name === emoji.name);
            if (existing) {
                console.log(`Emoji ${emoji.name} already exists!`);
                continue;
            }

            await guild.emojis.create({
                attachment: emoji.url,
                name: emoji.name,
            });

            console.log(`Uploaded emoji: ${emoji.name}`);
        }
  
    } catch (err) {
        console.error("Error uploading emojis:", err);
    }
});

client.login(process.env.DISCORD_TOKEN);
