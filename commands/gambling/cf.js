module.exports = {
    name: 'cf',
    description: 'Shortcut for !coinflip',
    usage: '!cf <amount>',
    async execute(message, args, client) {
      // Manually call the coinflip command
      const coinflip = require('./coinflip.js');
      coinflip.execute(message, args, client);
    },
  };
  