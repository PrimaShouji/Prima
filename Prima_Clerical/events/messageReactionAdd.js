const fs = require('fs');
const commontags = require('common-tags');

const {
	prefix,
	role_emoji,
	verify_button,
	verification_channel,
	role_channel,
	general_roles,
	arsenal_guild_id,
	error_channel
} = require('../config.json');

module.exports = async (client, logger, reaction, user) => {
	if (user.id === client.user.id) return; // if the reactor is this bot

	if (!reaction.message.channel) await reaction.message.guild.fetchMembers();

	userChannel = await reaction.message.guild.fetchMember(user.id);

	// Role reactions:
	if (reaction.message.channel.id === "551584585432039434" || reaction.message.channel.id === "590757405927669769") {
		for(var i = 0; i < (general_roles.length > role_emoji.length ? general_roles.length : role_emoji.length); i++) { // see client.ready for reasoning
			if (reaction._emoji.id === role_emoji[i]) {
				let role = reaction.message.guild.roles.find(r => r.name === general_roles[i]);
				await userChannel.addRole(role).catch((err) => {
					logger.log('error', `Failed to add a role to ${user.tag}`);
				});
				logger.log('info', `${user.tag} added to ${role.name}`);
			}
		}
	}

	// Verification reactions:
	if (reaction.message.channel.id == "552643167808258060" && reaction._emoji == verify_button) {
		// Get Crystal BA by ID
		guild = client.guilds.get(arsenal_guild_id);
		errorChannel = guild.channels.find(ch => ch.name === error_channel);

		userChannel.send(commontags.stripIndents`
			You have begun the verification process. Your **Discord account ID** is \`${user.id}\`.
			Please add this somewhere in your FFXIV Lodestone account description.
			You can edit your account description here: https://na.finalfantasyxiv.com/lodestone/my/setting/profile/

			After you have put your Discord account ID in your Lodestone profile, please use ${prefix}verify \`Lodestone ID\` to tell me your Lodestone ID **(located in your character profile URL)**.
			The API may not immediately update after you do this, so please wait a couple of minutes and use the command again if that happens.
		`).catch((error) => {
			errorChannel.send(`Couldn't send a message to ${userChannel.tag}. They may have their DMs disabled.`);
			logger.log('error', `Couldn't send a message to ${userChannel.tag}. They may have their DMs disabled.`);
		});
	}
}
