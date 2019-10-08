const cronJob = require('cron').CronJob;

const { mod_roles } = require('../config.json');

module.exports = {
	name: 'unloadcron',
	guildOnly: true,
	description: `Unloads a CronJob (Administrators only).`,
	execute(client, message, logger, args) {
		// Check if Administrator
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		if (!args || args.size < 1) return message.reply("Must provide a CronJob name to unload.");
		
		const cronName = args[0];
		
		delete require.cache[require.resolve(`../cronjobs/${cronName}.js`)]; // Remove from require cache
		
		if (client.cronJobs.has(cronName)) {
			client.cronJobs.get(cronName).stop(); // Stop the existing job.
			client.cronJobs.delete(cronName);
			
			logger.log('info', `CronJob ${cronName} has been stopped by ${message.author.tag}`);
			message.reply(`the CronJob ${cronName} has been unloaded!`);
			
			return;
		}
		
		message.reply(`that isn't an active CronJob!`);
	}
}