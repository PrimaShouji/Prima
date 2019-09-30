// https://anidiots.guide/first-bot/a-basic-command-handler
const { mod_roles } = require('../config.json');

module.exports = {
	name: 'reloadevent',
	guildOnly: true,
	description: `Reloads an event (Administrators only).`,
	execute(client, message, logger, args) {
		// Check if Administrator
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		if (!args || args.size < 1) return message.reply("Must provide an event name to reload.");
		
		const eventName = args[0];
		
		try {
			// the path is relative to the *current folder*, so just ./filename.js
			client.removeAllListeners(eventName);
			delete require.cache[require.resolve(`../events/${eventName}.js`)];
			
			// We now reassign the updated file to the event handler.
			clientEvent = require(`../events/${eventName}.js`);
			client.on(eventName, clientEvent.bind(null, client, logger));
			
			message.reply(`the event ${eventName} has been reloaded!`);
		} catch(err) {
			message.reply(`something went wrong, are you sure you typed the event name correctly?`);
		}
	}
}