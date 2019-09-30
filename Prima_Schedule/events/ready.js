const {
	prefix,
	presences,
	verification_channel,
	role_channel,
	role_emoji,
	general_roles,
	arsenal_guild_id,
	error_channel
} = require('../config.json');

module.exports = async (client, logger) => {
	// Bot setup
	logger.log('info', `Scheduler logged in as ${client.user.tag}!`);
	client.user.setPresence({ game: { name: `${presences[Math.floor(Math.random() * presences.length)]}` } });
	client.syncGuilds();
	
	// Notify
	client.guilds.forEach((value, key, map) => {
		statusChannel = value.channels.find(ch => ch.name === error_channel);
		statusChannel.send(`Scheduler loaded at ${new Date()}.`);
	});
}