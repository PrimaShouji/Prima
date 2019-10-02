module.exports = {
	name: 'setavatar',
	description: 'Set the bot\'s avatar (Kara only).',
	async execute(client, message, logger, args) {
		if (message.author.id !== "128581209109430272") return;
		client.user.setAvatar(args[0]).then(user => {
			message.reply(`the profile picture was updated!`);
		}).catch(error => {
			message.reply(`the request failed.`);
		});
	}
}
