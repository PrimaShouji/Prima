// Check every five minutes if someone's queue spot has expired, if so remove them.
const commontags = require('common-tags');
const fs = require('fs'); // Enables reading queues
const _ = require('lodash');
const { lfg_channels } = require('../config.json');

module.exports = {
	cronstring: '*/5 * * * *',
	execute(client, logger) {
		const roles = ['tank', 'healer', 'dps'];
		
		var now = new Date();9900000
		var startTime = now.getTime();
		
		const alerts = new Map();
		
		var finished = _.after(lfg_channels.length * roles.length, () => {
			var endTime = new Date().getTime();
			
			logger.log('info', `Finished queue expiry job (t=${endTime - startTime}ms).`);
		});
		
		for (channel of lfg_channels) {
			for (role of roles) {
				var data = client.BAqueues.get(`${channel}.${role}`);
				var count = 0;
				
				if (!data) continue;
				
				newData = data.slice();
				
				for (var i = 1; i <= data.length; i++) {
					if (i % 2 === 0) {
						if (parseInt(data[i - 2]) + 10800000 < now.getTime()) { // 3 hours or more have passed
							if (!alerts.get(data[i - 1])) alerts.set(data[i - 1], []);
						
							alerts.get(data[i - 1]).push(`timeout.${channel}.${role}`);
							
							newData.splice(newData.indexOf(data[i - 2]), 2);
							count++;
						} else if (parseInt(data[i - 2]) + 9900000 < now.getTime()) { // 2:45 elapsed
							if (!alerts.get(data[i - 1])) alerts.set(data[i - 1], []);
							
							alerts.get(data[i - 1]).push(`refresh.${channel}.${role}`);
						}
					}
				}
				
				if (count !== 0) {
					logger.log('info', `Timed ${count} members out of ${channel}'s ${role}.queue`);
					client.BAqueues.set(`${channel}.${role}`, newData);
				}
			}
		}
		
		alerts.forEach((value, key, map) => {
			if (client.users.get(key)) {
				var timeouts = ``;
				var refreshes = ``;
				
				for (item of value) {
					item = item.split(/\./gm);
					
					if (item[0] === `timeout`) timeouts += `#${item[1]}: ${item[2]}\n`;
					if (item[0] === `refresh`) refreshes += `#${item[1]}: ${item[2]}\n`;
				}
				
				if (timeouts) {
					client.users.get(key).send(commontags.stripIndents`
						You have been in the following queues for more than three hours, and have been removed:
						
						${timeouts}
						Please requeue if you are still active.
					`);
				}
				
				if (refreshes) {
					client.users.get(key).send(commontags.stripIndents`
						You have been in the following queues for two hours and forty-five minutes:
						
						${refreshes}
						Please send \`~refreshqueue\` within the next 15 minutes to avoid being kicked under our 3-hour time limit.
						This command will renew your queue times and allow you to stay queued for an additional 3 hours.
					`);
				}
			}
		});
	}
}