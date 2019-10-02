const { mod_roles, prefix } = require('../config.json');

module.exports = {
	name: 'when',
	args: true,
	description: `Shows when an account was created.`,
	execute(client, message, logger, args) {
		//
		// FUNCTION DECLARATIONS
		//
		
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
		
		//
		// MAIN LOGIC
		//
		
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		try {
			var user = client.users.get(getUserFromMention(args[0]));
			var timestampFromSnowflake = (user.id / 4194304) + 1420070400000;
			
			var then = new Date(timestampFromSnowflake).toUTCString();
			
			message.reply(then);
		} catch (e) {
			message.reply(`that's not a valid member. Usage: \`${prefix}when <mention>\``);
		}
	}
}