module.exports = {
    name: 'ap',
    description: 'Shortcut for !adminpanel',
    usage: '!adminpanel @username',
    async execute(message, args, client) {
      // Manually call the coinflip command
      const adminpanel = require('./adminpanel.js');
      adminpanel.execute(message, args, client);
    },
  };
  