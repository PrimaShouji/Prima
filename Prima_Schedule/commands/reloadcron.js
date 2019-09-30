const cronJob = require('cron').CronJob;

const { mod_roles } = require('../config.json');

module.exports = {
	name: 'reloadcron',
	guildOnly: true,
	description: `Reloads a CronJob (Administrators only).`,
	execute(client, message, logger, args) {
		// Check if Administrator
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		if (!args || args.size < 1) return message.reply("Must provide a CronJob name to reload.");
		
		const cronName = args[0];
		
		try {
			require.resolve(`../cronjobs/${cronName}.js`);
		} catch (error) {
			return logger.log('error', `This bot does not have that CronJob.`);
		}
		
		delete require.cache[require.resolve(`../cronjobs/${cronName}.js`)]; // Remove from require cache
		
		if (client.cronJobs.has(cronName)) {
			client.cronJobs.get(cronName).stop(); // Stop the existing job.
		}
		
		cronEvent = require(`../cronjobs/${cronName}.js`);
		client.cronJobs.set(cronName, new cronJob(cronEvent.cronstring, () => cronEvent.execute(client, logger), null, true)); // Start the new one.
		
		logger.log('info', `CronJob ${cronName} has been reloaded by ${message.author.tag}.`);
		message.reply(`the CronJob ${cronName} has been reloaded!`);
	}
}