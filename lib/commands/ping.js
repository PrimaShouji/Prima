module.exports = {
	permissionLevel: "Administrator",
	async execute: (client, logger, message) {
		const output = `prima-${client.domain} online, heartbeat ${client.ping}ms`;
		await message.channel.send(`\`${output}\``);
		logger.info(output);
	},
}
