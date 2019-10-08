const { prefix } = require('../config.json');

module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command.',
	aliases: ['?', 'commands'],
	usage: '[command name]',
	execute(client, message, logger, args) {
		const data = [];
		const { commands } = message.client;
		
		if(!args.length) {
			data.push(commands.map(command => command.name).join(', '));

			return message.author.send(data, { split: true })
				.then(() => {
					if (message.channel.type === 'dm') return;
				})
				.catch(error => {
					console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
				});
		}

		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		data.push(`**Name:** ${command.name}`);

		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);

		data.push(`**Cooldown:** ${command.cooldown || 0} second(s)`);

		message.channel.send(data, { split: true });
	},
};