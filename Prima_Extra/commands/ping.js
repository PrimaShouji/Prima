const pjson = require('../package.json');

module.exports = {
	name: 'ping',
	execute(client, message, logger, args) {
		message.channel.send(`\`${pjson.name} online, heartbeat ${client.ping}ms\``);
	}
}
