module.exports = {
    name: 'shop',
  
    async execute(message) {
      return message.reply(
        `🛒 **Welcome to the Shop!**\nType \`!buy <item>\` to purchase something.\n\n` +
        `**Available Items:**\n` +
        `1. 🔨 Upgrade Pickaxe (10 coal)\n` +
        `2. 🕯️ Torch (5 coal)\n` +
        `3. 🍀 Lucky Charm (1 emerald)\n` +
        `4. 💎 Super Pickaxe (10 diamond) (temporary boost)\n`
      );
    }
  };
  