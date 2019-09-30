const { mod_roles } = require('../config.json');

module.exports = {
	name: 'disable',
	description: `Disables a command (Administrators only)`,
	args: true,
	execute(client, message, logger, args) {
		// Check if Administrator
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		const commandName = args[0];
		
		try {
			// the path is relative to the *current folder*, so just ./filename.js
			delete require.cache[require.resolve(`./${commandName}.js`)];
			
			// We also need to delete and reload the command from the client.commands Enmap
			client.commands.delete(commandName);
		} catch(error) {
			message.reply(`something went wrong, are you sure you spelled the command name properly?`);
		}
	}
}