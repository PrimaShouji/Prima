const fs = require('fs'); // Enables reading queues
const { Attachment } = require('discord.js');

const { arsenal_server, mod_roles, lfg_channels } = require('../config.json');

module.exports = {
	name: 'exportqueue',
	guildOnly: true,
	guild: `${arsenal_server}`,
	execute(client, message, logger, args) {
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		var channel = message.channel.name;
		if (lfg_channels.indexOf(channel) === -1) return; // Don't use this outside of lfg channels
		
		message.delete();
		
		const roles = ['dps', 'healer', 'tank'];
		
		for (role of roles) {
			message.author.send(`${role}: \`${client.BAqueues.get(`${channel}.${role}`)}\``);
		}
	},
};