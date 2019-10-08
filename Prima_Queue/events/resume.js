const {
	arsenal_guild_id,
	error_channel
} = require('../config.json');

module.exports = async (client, logger, replayed) => {
	guild = client.guilds.get(arsenal_guild_id);
	statusChannel = guild.channels.find(ch => ch.name === error_channel);
	
	logger.log('info', `${replayed} events replayed.`);
	statusChannel.send(`Reconnected.`);
}