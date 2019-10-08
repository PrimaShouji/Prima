const commontags = require('common-tags');
const fs = require('fs');
const _ = require('lodash');

const { mod_roles, lfg_channels } = require('../config.json');

module.exports = {
	name: 'destroyqueues',
	description: `Destroys all queues (Administrators only). This is an irreversible action. ~~Also recreates blank ones, but destroy sounds cooler than recreate.~~`,
	execute(client, message, logger, args) {
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		logger.log('info', `Destroying all queues.`);
		message.channel.send(`Destroying all queues, please wait...`);
		
		for (channel of lfg_channels) {
			client.BAqueues.set(`${channel}.dps`, []);
			
			fs.unlink(`./queues/${channel}/dps.queue`, (err1) => {
				if (err1) throw err1;
				
				fs.writeFile(`./queues/${channel}/dps.queue`, '', (err2) => {
					if (err2) throw err2;
				});
				
				finished();
			});
			
			client.BAqueues.set(`${channel}.healer`, []);
			
			fs.unlink(`./queues/${channel}/healer.queue`, (err1) => {
				if (err1) throw err1;
				
				fs.writeFile(`./queues/${channel}/healer.queue`, '', (err2) => {
					if (err2) throw err2;
				});
				
				finished();
			});
			
			client.BAqueues.set(`${channel}.tank`, []);
			
			fs.unlink(`./queues/${channel}/tank.queue`, (err1) => {
				if (err1) throw err1;
				
				fs.writeFile(`./queues/${channel}/tank.queue`, '', (err2) => {
					if (err2) throw err2;
				});
				
				finished();
			});
			logger.log('info', `${channel}'s queues have been removed.`);
		}
			
		finished = _.after(lfg_channels.length * 3, () => {
			for (channel of lfg_channels) {
				fs.writeFile(`./queues/${channel}/dps.queue`, '', (err2) => {
					if (err2) throw err2;
				});
				fs.writeFile(`./queues/${channel}/healer.queue`, '', (err2) => {
					if (err2) throw err2;
				});
				fs.writeFile(`./queues/${channel}/tank.queue`, '', (err2) => {
					if (err2) throw err2;
				});
			}
			
			message.reply(`all queues have been destroyed.`);
		});
	}
}