const fs = require('fs'); // Enables writing to queues
const _ = require('lodash');
const Prima = require('prima-common.js');
const { lfg_channels, arsenal_server } = require('../config.json');

module.exports = {
	name: 'leavequeue',
	guildOnly: true,
	guild: `${arsenal_server}`,
	description: 'Stop looking for a Baldesion Arsenal group in a channel.',
	aliases: ['unqueue', 'leave'],
	execute(client, message, logger, args) {
		message.delete();
		
		if(lfg_channels.indexOf(channel) === -1) return; // Don't use this outside of lfg channels
		
		var removedAny = false;
		channel = message.channel.name;
		
		data = [];
		roles = ['', '', ''];
		roleTypes = ['dps', 'healer', 'tank'];
		fixedroles = args.join();
		specific = false;
		
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
	},
};