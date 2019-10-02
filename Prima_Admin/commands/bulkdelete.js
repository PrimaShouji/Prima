const { mod_roles } = require('../config.json');

module.exports = {
	name: 'bulkdelete',
	args: true,
	execute(client, message, logger, args) {
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		var amount = args[0];
		
		message.channel.bulkDelete(amount).then((msgs) => {
			logger.log('info', `Removed ${msgs.size} messages from ${message.channel.name}`);
		});
	}
}