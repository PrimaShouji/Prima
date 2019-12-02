module.exports = {
	permissionLevel: "Administrator",
	execute: (client, logger, message) => {
		const output = `prima-${client.domain} online, heartbeat ${client.ping}ms`;
		message.channel.send(`\`${output}\``);
		logger.info(output);
	},
}
