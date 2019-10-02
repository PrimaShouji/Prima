const { karashiiro } = require('../config.json');

module.exports = {
	name: 'presence',
	args: true,
	description: 'Sets what this bot is doing right now (only karashiiro can use this uwu).',
	execute(client, message, logger, args) {
		if (message.author.id != karashiiro) return;
		
		message = args.join().replace(/,/g, ' ');
		
		client.user.setPresence({ game: { name: `${message}` } });
	},
};