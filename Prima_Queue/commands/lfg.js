const fs = require('fs'); // Enables writing to queues
const _ = require('lodash');
const Prima = require('prima-common.js');
const { lfg_channels, arsenal_server } = require('../config.json');

module.exports = {
	name: 'lfg',
	aliases: ['join', 'joinqueue'],
	args: true,
	guildOnly: true,
	cooldown: 0.01,
	guild: `${arsenal_server}`,
	description: 'Add yourself to the queue looking for a Baldesion Arsenal run. You will be removed from the queue when you are selected for a group.',
	usage: '<[d][h][t]>',
	execute(client, message, logger, args) {
		message.delete(); // We delete the message no matter what channel it's in.
		
		if(lfg_channels.indexOf(channel) === -1) return; // Don't use this outside of lfg channels
		
		data = [];
		roles = ['', '', ''];
		fixedroles = args.join();
		channel = message.channel.name;
		
		if (fixedroles.search('d' || 'dps') !== -1) {
			data += 'DPS';
			roles[0] = 'dps';
		}
		if (fixedroles.search('h' || 'healer') !== -1) {
			if (data.length > 0) {
				data += '/';
			}
			data += 'Healer';
			roles[1] = 'healer';
		}
		if (fixedroles.search('t' || 'tank') !== -1) {
			if (data.length > 0) {
				data += '/';
			}
			data += 'Tank';
			roles[2] = 'tank';
		}
		
		if(data === '') { // In case someone slides by by typing ~lfg c or something
			message.reply(`something went wrong... Next time, make sure you enter a valid role identifier, such as "d" or "healer".`).then((msg) => msg.delete(5000));
			return;
		}
		
		
		if (roles[0] !== '') { // If queueing as a DPS
			if (!Prima.enQueue(client, channel, message.author.id, 'dps')) {
				roles[0] = '';
			}
		}
		
		if (roles[1] !== '') { // If queueing as a Healer
			if (!Prima.enQueue(client, channel, message.author.id, 'healer')) {
				roles[1] = '';
			}
		}
		
		if (roles[2] !== '') { // If queueing as a Tank
			if (!Prima.enQueue(client, channel, message.author.id, 'tank')) {
				roles[2] = '';
			}
		}
		
		roleString = '';
		if (roles[0] !== '' && roles[1] !== '' && roles[2] !== '') {
			roleString = 'DPS, Healer, and Tank.';
		} else if (roles[0] !== '' && roles[1] !== '' && roles[2] === '') {
			roleString = 'DPS and Healer.';
		} else if (roles[0] !== '' && roles[1] === '' && roles[2] === '') {
			roleString = 'DPS.';
		} else if (roles[0] === '' && roles[1] === '' && roles[2] !== '') {
			roleString = 'Tank.';
		} else if (roles[0] === '' && roles[1] !== '' && roles[2] !== '') {
			roleString = 'Healer and Tank.';
		} else if (roles[0] === '' && roles[1] !== '' && roles[2] === '') {
			roleString = 'Healer.';
		} else if (roles[0] !== '' && roles[1] === '' && roles[2] !== '') {
			roleString = 'DPS and Tank.';
		} else {
			message.reply(`you're already in those queues. You can check your position in them with \`~queue\`. Don't forget to relevel if you're not level 60 yet!`).then((msg) => msg.delete(10000));
			return;
		}
		
		var tank, healer, dps, tankAll, healerAll, dpsAll;
		channel = message.channel.name;
		id = message.author.id;
		
		finished = _.after(3, () => {
			output = `You are number `;
			
			if (tank > 0) {
				output = output + `${tank}/${tankAll.length} in the Tank queue`;
			}
			if (healer > 0) {
				if (tank > 0 && dps === 0) { // Healer and tank, but not DPS
					output = output + ` and ${healer}/${healerAll.length} in the Healer queue`;
				} else if (tank > 0) { // Healer, tank, and DPS
					output = output + `, ${healer}/${healerAll.length} in the Healer queue`;
				} else { // Only healer
					output = output + `${healer}/${healerAll.length} in the Healer queue`;
				}
			}
			if (dps > 0) {
				if (healer > 0 && tank > 0) { // Healer, tank, and dps
					output = output + `, and ${dps}/${dpsAll.length} in the DPS queue`;
				} else if (healer > 0 || tank > 0) { // Healer or tank, and dps
					output = output + ` and ${dps}/${dpsAll.length} in the DPS queue`;
				} else {// Just DPS
					output = output + `${dps}/${dpsAll.length} in the DPS queue`
				}
			}
			output = output + `.`;
			
			logger.log('info', `Added ${message.author.tag} to ${channel}'s queue as ${roles}.`);
			message.reply(`you have been added to the queue as a ${roleString} ${output} Don't forget to relevel if you're not level 60 yet!`).then((msg) => msg.delete(5000));
		});
		
		Prima.countMembers(client, "dps", (res) => { dpsAll = res; dps = dpsAll ? dpsAll.indexOf(id) + 1 : 0; finished(); }); // If at front of queue, should output 1
		Prima.countMembers(client, "healer", (res) => { healerAll = res; healer = healerAll ? healerAll.indexOf(id) + 1 : 0; finished(); }); // If not in queue, should output 0
		Prima.countMembers(client, "tank", (res) => { tankAll = res; tank = tankAll ? tankAll.indexOf(id) + 1 : 0; finished(); }); // If fileread fails, should output 0
	},
};