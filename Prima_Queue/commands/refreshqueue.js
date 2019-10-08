const { lfg_channels } = require('../config');

module.exports = {
	name: 'refreshqueue',
	aliases: ['refresh', 'queuerefresh'],
	execute(client, message, logger, args) {
		if (message.guild) message.delete();
		
		const roles = ['dps', 'healer', 'tank'];
		var any = false;
		
		for (channel of lfg_channels) {
			for (r of roles) {
				var queue = client.BAqueues.get(`${channel}.${r}`);
				
				if (queue.indexOf(message.author.id) !== -1) {
					queue[queue.indexOf(message.author.id) - 1] = new Date().getTime();
					any = true;
				}
			}
		}
		
		if (any) return message.reply(`your queue times in all queues have been refreshed!`).then((m) => m.delete(5000));
		
		message.reply(`you aren't in any queues!`).then((m) => m.delete(3000));
	}
}