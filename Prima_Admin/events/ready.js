const {
	presences,
	error_channel
} = require('../config.json');

module.exports = async (client, logger) => {
	// Bot setup
	logger.log('info', `Admin bot logged in as ${client.user.tag}!`);
	client.user.setPresence({ game: { name: `${presences[Math.floor(Math.random() * presences.length)]}` } });
	client.syncGuilds();
	
	// Notify
	client.guilds.forEach((value, key, map) => {
		statusChannel = value.channels.find(ch => ch.name === error_channel);
		statusChannel.send(`Admin bot loaded at ${new Date()}.`);
	});
}