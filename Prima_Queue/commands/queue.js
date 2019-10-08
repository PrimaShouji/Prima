const _ = require('lodash');
const fs = require('fs');
const Prima = require('prima-common.js');

const { lfg_channels, arsenal_server } = require('../config.json');

module.exports = {
	name: 'queue',
	guildOnly: true,
	guild: `${arsenal_server}`,
	description: 'View your position in each queue.',
	aliases: ['que', 'queueposition', 'checkqueue'],
	execute(client, message, logger, args) {
		const channel = message.channel.name;
		
		if(lfg_channels.indexOf(channel) === -1) return; // Don't use this outside of lfg channels
		
		const id = message.author.id;
		
		if (args && args[0] === "leave") {
			message.delete();
			
			args.shift();
			
			var roles = ['', '', ''];
			var roleTypes = ['dps', 'healer', 'tank'];
			var fixedroles = args.join();
			var specific = false;
			
			if (fixedroles.search('d' || 'dps') !== -1) {
				data += 'DPS';
				roles[0] = 'dps';
				specific = true;
			}
			if (fixedroles.search('h' || 'healer') !== -1) {
				if (data.length > 0) {
					data += '/';
				}
				data += 'Healer';
				roles[1] = 'healer';
				specific = true;
			}
			if (fixedroles.search('t' || 'tank') !== -1) {
				if (data.length > 0) {
					data += '/';
				}
				data += 'Tank';
				roles[2] = 'tank';
				specific = true;
			}
			
			for (var i = 0; i < roles.length; i++) {
				if (roles[i] !== '') {
					if (Prima.removeFromQueue(client, channel, message.author.id, roleTypes[i])) {
						removedAny = true;
					} else {
						roles[i] = '';
					}
				}
			}
			
			if (!specific) {
				for (var i = 0; i < roles.length; i++) {
					if (Prima.removeFromQueue(client, channel, message.author.id, roleTypes[i])) {
						removedAny = true;
					}
				}
			}
			
			roleString = '';
			if (roles[0] !== '' && roles[1] !== '' && roles[2] !== '') {
				roleString = 'DPS, Healer, and Tank';
			} else if (roles[0] !== '' && roles[1] !== '' && roles[2] === '') {
				roleString = 'DPS and Healer';
			} else if (roles[0] !== '' && roles[1] === '' && roles[2] === '') {
				roleString = 'DPS';
			} else if (roles[0] === '' && roles[1] === '' && roles[2] !== '') {
				roleString = 'Tank';
			} else if (roles[0] === '' && roles[1] !== '' && roles[2] !== '') {
				roleString = 'Healer and Tank';
			} else if (roles[0] === '' && roles[1] !== '' && roles[2] === '') {
				roleString = 'Healer';
			} else if (roles[0] !== '' && roles[1] === '' && roles[2] !== '') {
				roleString = 'DPS and Tank';
			}
			
			roleString = specific ? "s for " + roleString : "";
			
			if (removedAny) {
				logger.log('info', `Removed ${message.author.tag} from ${channel}'s queue${roleString}.`);
				message.reply(`you have been removed from this channel's queue${roleString}.`).then((msg) => msg.delete(5000));
				message.channel.send(`<@${message.author.id}> has left the queue${roleString}.`).then((msg) => msg.delete(60000));
			} else { // removedAny === false
				message.reply(`you weren't found in any queues in this channel.`).then((msg) => msg.delete(5000));
			}
			
			return;
		} else if (args) {
			const fixedroles = args.join();
			
			if (fixedroles.indexOf('d') !== -1 || fixedroles.indexOf('h') !== -1 || fixedroles.indexOf('t') !== -1) {
				message.delete();
				
				var data = [];
				var roles = ['', '', ''];
				
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
					if (!Prima.enQueue(client, channel, id, 'dps')) {
						roles[0] = '';
					}
				}
				
				if (roles[1] !== '') { // If queueing as a Healer
					if (!Prima.enQueue(client, channel, id, 'healer')) {
						roles[1] = '';
					}
				}
				
				if (roles[2] !== '') { // If queueing as a Tank
					if (!Prima.enQueue(client, channel, id, 'tank')) {
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
					message.reply(`you're already in those queues. You can check your position in them with \`~queue\`.`).then((msg) => msg.delete(10000));
					return;
				}
				
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
				
				return;
			}
		}
		
		tankAll = client.BAqueues.get(`${channel}.tank`);
		healerAll = client.BAqueues.get(`${channel}.healer`);
		dpsAll = client.BAqueues.get(`${channel}.dps`);
		tank = tankAll ? (tankAll.indexOf(id) + 1) / 2 : 0; // If at front of queue, should output 1
		healer = healerAll ? (healerAll.indexOf(id) + 1) / 2 : 0; // If not in queue, should output 0
		dps = dpsAll ? (dpsAll.indexOf(id) + 1) / 2 : 0;
		
		var output = `you are number `;
		
		if (tank + healer + dps === 0) {
			message.reply(`you are not in any queues. If you meant to join the queue, use \`~lfg <role>\`.`);
			return;
		}
		
		if (tank > 0) {
			output = output + `${tank}/${tankAll.length / 2} in the Tank queue`;
		}
		if (healer > 0) {
			if (tank > 0 && dps === 0) { // Healer and tank, but not DPS
				output = output + ` and ${healer}/${healerAll.length / 2} in the Healer queue`;
			} else if (tank > 0) { // Healer, tank, and DPS
				output = output + `, ${healer}/${healerAll.length / 2} in the Healer queue`;
			} else { // Only healer
				output = output + `${healer}/${healerAll.length / 2} in the Healer queue`;
			}
		}
		if (dps > 0) {
			if (healer > 0 && tank > 0) { // Healer, tank, and dps
				output = output + `, and ${dps}/${dpsAll.length / 2} in the DPS queue`;
			} else if (healer > 0 || tank > 0) { // Healer or tank, and dps
				output = output + ` and ${dps}/${dpsAll.length / 2} in the DPS queue`;
			} else {// Just DPS
				output = output + `${dps}/${dpsAll.length / 2} in the DPS queue`
			}
		}
		output = output + `.`;
		
		message.reply(output + " Don't forget to relevel if you're not level 60 yet!");
	},
};