const { exec } = require('child_process');
const { mod_roles } = require('../config.json');

module.exports = {
	name: 'restart',
	execute(client, message, logger, args) {
		// Check if Administrator
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;

		message.channel.send(`Restarting in 5 seconds...`);

		if (args.length > 0) {
			setTimeout(() => {
				exec('pm2 restart ' + args[0].replace(/[^a-zA-Z-]/g, ""));
			}, 5000);
		} else {
			setTimeout(() => {
				exec('pm2 restart prima-admin');
				exec('pm2 restart prima-clerical');
				exec('pm2 restart prima-queue');
				exec('pm2 restart prima-scheduler');
				exec('pm2 restart prima-extra');
				exec('pm2 restart prima-restart');
			}, 5000);
		}
	}
}
