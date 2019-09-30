// Check every half hour if there's going to be a run in half an hour
const commontags = require('common-tags');
const fs = require('fs'); // Enables reading command plugin folder
const { arsenal_guild_id } = require('../config.json');

module.exports = {
	cronstring: '*/30 * * * *',
	execute(client, logger) {
		function clone(a) {
			return JSON.parse(JSON.stringify(a));
		}
		
		now = new Date();
		days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		rsvpList = fs.readdirSync('./schedules');
		
		while (file = rsvpList.pop()) {
			data = fs.readFileSync(`./schedules/${file}`).toString().split(/,/gm);
			
			logger.log('info', file);
			var leader;
			leader = client.users.get(data[2]);
			if (leader === undefined) leader = client.guilds.find(g => g.id === arsenal_guild_id).fetchMember(data[2]).catch((e) => leader = e);
			logger.log('info', leader.tag);
			
			day = data[0];
			hour = parseInt(data[1].substr(0, data[1].indexOf(':')));
			minute = parseInt(data[1].substr(data[1].indexOf(':') + 1, data[1].indexOf(' ')));
			meridiem = data[1].substr(data[1].indexOf(' ') + 1);
			logger.log('info', `${day},${hour}:${minute < 10 ? "0" + minute : minute} ${meridiem}`);
			
			if (hour !== 12 && meridiem == 'PM') {
				hour += 12;
			}
			
			if (day === days[now.getDay()]) {
				if (hour === now.getHours() && minute - 30 === now.getMinutes() ||  // Should ping if current time is 12:00PM and listed time is 12:30PM
				hour === now.getHours() + 1 && minute + 30 === now.getMinutes() ||  // Should ping if current time is 13:30PM and listed time is 14:00PM
				hour - 23 === now.getHours() && minute + 30 === now.getMinutes()) { // Should ping if current time is 24:30PM and listed time is 00:00AM
					data.reverse();
					data = data.slice(1); // Remove last comma
					data.reverse();
					data = data.slice(3); // Remove metadata
					
					while (data.length !== 0) {
						id = data.pop();
						try {
							member = client.users.get(id);
							member.send(`The run you reacted to (hosted by ${leader.tag}) is scheduled to begin in 30 minutes!`);
							logger.log('info', `Info sent to ${member.tag} about ${leader.tag}'s run.`);
						} catch (e1) {
							logger.log('error', `${e1}, trying again.`);
							try {
								member = client.guilds.find(g => g.id = arsenal_guild_id).fetchMember(id);
								member.send(`The run you reacted to (hosted by ${leader.tag}) is beginning in 30 minutes!`);
								logger.log('info', `Info sent to ${member.tag} about ${leader.tag}'s run.`);
							} catch (e2) {
								try {
									logger.log('error', `Tried again and failed, messaging in channel: ${e2}`);
									client.guilds.find(g => g.id = arsenal_guild_id).channels.find(ch => ch.name === "scheduling-discussion").send(commontags.stripIndents`
										<@${id}>, the run you reacted to (hosted by ${leader.tag}) is scheduled to begin in 30 minutes! (DM failed, fallback hit.)
									`);
								} catch (e3) {
									logger.log('error', `Every attempt at notifying user ${id} failed.`);
								}
							}
						}
					}
					
					var hold = clone(file);
					leader.send(`The run you scheduled is set to begin in 30 minutes!`);
					fs.unlink(`./schedules/${file}`, (err2) => {
						if (err2) throw err2;
						
						logger.log('info', `File ${hold} has been removed.`);
					});
				}
			}
		}
	}
}