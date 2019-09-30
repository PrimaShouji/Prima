const { mod_roles } = require('../config.json');

module.exports = {
	name: 'reloadcommon',
	guildOnly: true,
	description: `Reloads the common library (Administrators only).`,
	execute(client, message, logger, args) {
		// Check if Administrator
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		delete require.cache[require.resolve(`../prima-common.js`)]; // Remove from require cache
		
		reassigned = require(`../prima-common.js`);
		
		logger.log('info', `Common library reloaded by ${message.author.tag}.`);
		message.reply(`the common library has been reloaded!`);
	}
}