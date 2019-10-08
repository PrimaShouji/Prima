const fs = require('fs'); // Enables writing queues
const commontags = require('common-tags');
const { prefix, arsenal_server, mod_roles, lfg_channels, arsenal_guild_id, error_channel } = require('../config.json');

module.exports = {
	name: 'deletequeueentry',
	args: true,
	guildOnly: true,
	guild: `${arsenal_server}`,
	execute(client, message, logger, args) {
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		var channel = message.channel.name;
		if (lfg_channels.indexOf(channel) === -1) return; // Don't use this outside of lfg channels
		
		message.delete();
		
		guild = client.guilds.get(arsenal_guild_id);
		errorChannel = guild.channels.find(ch => ch.name === error_channel);
		
		const roles = ['dps', 'healer', 'tank'];
		
		if (roles.indexOf(args[0]) === -1) {
			errorChannel.send(commontags.stripIndents`
				<@${message.author.id}>, the first argument is supposed to be a role.
				Please try again, checking to make sure all arguments were entered correctly.
				Usage: \`${prefix}deletequeueentry <role> <index>\`
			`);
			
			return;
		}
		
		try {
			index = parseInt(args[1]);
			data = client.BAqueues.get(`${channel}.${args[0]}`);
			data.splice(index, 1);
		} catch (error) {
			errorChannel.send(commontags.stripIndents`
				<@${message.author.id}>, the second argument is supposed to be an array index number. Please remember that array indices begin at 0, not 1.
				Please try again, checking to make sure all arguments were entered correctly.
				Usage: \`${prefix}deletequeueentry <role> <index>\`
			`);
			logger.log('error', error);
		}
	},
};