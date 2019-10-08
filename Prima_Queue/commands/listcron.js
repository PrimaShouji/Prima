const commontags = require('common-tags');
const cronJob = require('cron').CronJob;

const { mod_roles } = require('../config.json');

module.exports = {
	name: 'listcron',
	guildOnly: true,
	description: `Lists all running CronJobs (Administrators only).`,
	execute(client, message, logger, args) {
		// Check if Administrator
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		let res = ``;
		
		for (job of client.cronJobs) {
			res += `${job[0]}\n`
		}
		
		message.channel.send(commontags.stripIndents`
			Active CronJobs:
			${res}
		`);
	}
}