const fs = require('fs'); // Enables reading queues
const _ = require('lodash');
const Prima = require('prima-common.js');
const { queuelistsnark, queuelistlawd, lfg_channels, arsenal_server } = require('../config.json');

module.exports = {
	name: 'queuelist',
	guildOnly: true,
	guild: `${arsenal_server}`,
	description: 'View the number of players in each queue.',
	execute(client, message, logger, args) {
		var tank, healer, dps, uniqueusers;
		var allTanks = [];
		var allHealers = [];
		var allDPS = [];
		channel = message.channel.name;
		
		if(lfg_channels.indexOf(channel) === -1) return; // Don't use this outside of lfg channels
		
		finished = _.after(3, () => {
			uniqueusers = [];
			
			if (allTanks && allTanks.length) {
				uniqueusers = uniqueusers.concat(allTanks);
			}
			if (allHealers && allHealers.length) {
				uniqueusers = uniqueusers.concat(allHealers);
			}
			if (allDPS && allDPS.length) {
				uniqueusers = uniqueusers.concat(allDPS);
			}
			
			uniqueusers = _.uniq(uniqueusers); // Get the array of unique users in queue.
			uniqueusersCount = uniqueusers.length; // Count the array size.
			
			logger.log('info', `${channel}'s queues: ${tank} tank(s), ${healer} healer(s), and ${dps} DPS. (Unique players: ${uniqueusersCount})`);
			message.channel.send(`There are currently ${tank} tank(s), ${healer} healer(s), and ${dps} DPS in the queue. (Unique players: ${uniqueusersCount})`);
			if (tank >= 14 && healer >= 28 && dps >= 70 && uniqueusersCount >= 112) {
				lawdcomment = queuelistlawd[Math.floor(Math.random() * queuelistlawd.length)]
				message.channel.send(lawdcomment);
			} else if (tank >= 7 && healer >= 14 && dps >= 35 && uniqueusersCount >= 56) {
				snarkycomment = queuelistsnark[Math.floor(Math.random() * queuelistsnark.length)]
				message.channel.send(snarkycomment);
			}
		});
		
		Prima.countMembers(client, "dps", (res) => { allDPS = res; dps = res ? res.length : 0; finished(); });
		Prima.countMembers(client, "healer", (res) => { allHealers = res; healer = res ? res.length : 0; finished(); });
		Prima.countMembers(client, "tank", (res) => { allTanks = res; tank = res ? res.length : 0; finished(); });
	},
};