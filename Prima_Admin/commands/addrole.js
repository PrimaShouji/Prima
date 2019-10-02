const commontags = require('common-tags');
const { prefix, mod_roles, arsenal_guild_id, error_channel } = require('../config.json');

module.exports = {
	name: 'addrole',
	args: true,
	execute(client, message, logger, args) {
		function getUserFromMention(mention) {
			if (!mention) return;

			if (mention.startsWith('<@') && mention.endsWith('>')) {
				mention = mention.slice(2, -1);

				if (mention.startsWith('!')) {
					mention = mention.slice(1);
				}

				return mention;
			}
		}

		
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		message.delete();
		
		userID = getUserFromMention(args.shift());
		roleName = args.join(" ");
		
		guild = client.guilds.get(arsenal_guild_id);
		errorChannel = guild.channels.find(ch => ch.name === error_channel);
		
		guild.members.find(mem => mem.id === userID)
		.addRole(guild.roles.find(role => role.name === roleName))
		.catch((error) => { // Maybe they were banned? Who knows why this would fail.
			errorChannel.send(commontags.stripIndents`
				<@${message.author.id}>, adding that role failed. This could be because of one of several factors, including but not limited to:
				:one: A bad user mention.
				:two: A misspelt role name.
				:three: My Discord client being slow.
				Please try again, checking to make sure all arguments were entered correctly.
				Usage: \`${prefix}addrole <mention> <role name>\`
			`);
		});
	}
}