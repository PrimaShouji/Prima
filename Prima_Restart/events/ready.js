const {
	error_channel
} = require('../config.json');

module.exports = async (client, logger) => {
	// Bot setup
	logger.log('info', `Restart bot logged in as ${client.user.tag}!`);
	client.syncGuilds();
	
	// Notify
	client.guilds.forEach((value, key, map) => {
		statusChannel = value.channels.find(ch => ch.name === error_channel);
		statusChannel.send(`Restart bot loaded at ${new Date()}.`);
	});
}