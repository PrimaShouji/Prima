const fs = require('fs');

const {
	role_emoji,
	role_channel,
	general_roles
} = require('../config.json');

module.exports = async (client, logger, reaction, user) => {
	if (user.id === client.user.id) return;
	
	if (!reaction.message.channel) await reaction.message.guild.fetchMembers();

	userChannel = await reaction.message.guild.fetchMember(user.id);

	// Role reactions:
	if (reaction.message.channel.id === "551584585432039434" || reaction.message.channel.id === "590757405927669769") {
		for(var i = 0; i < (general_roles.length > role_emoji.length ? general_roles.length : role_emoji.length); i++) { // see client.ready for reasoning
			if (reaction._emoji.id === role_emoji[i]) {
				let role = reaction.message.guild.roles.find(r => r.name === general_roles[i]);
				await userChannel.removeRole(role).catch((err) => {
					logger.log('error', `Failed to remove a role from ${user.tag}`);
				});
				logger.log('info', `${user.tag} removed from ${role.name}`);
			}
		}
	}
}
