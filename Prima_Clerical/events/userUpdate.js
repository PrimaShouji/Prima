const {
	arsenal_guild_id,
	error_channel
} = require('../config.json');

module.exports = async (client, logger, oldUser, newUser) => {
	guild = client.guilds.get(arsenal_guild_id);
	statusChannel = guild.channels.find(ch => ch.name === error_channel);
	
	if (oldUser.tag === newUser.tag) return;
	
	logger.log('warn', `User ${oldUser.tag} changed their username to ${newUser.tag}.`);
	statusChannel.send(`User ${oldUser.tag} changed their username to ${newUser.tag}.`);
}