const Discord = require("discord.js");

module.exports = async (client, logger, event) => {
	const events = {
		MESSAGE_REACTION_ADD: "messageReactionAdd",
		MESSAGE_REACTION_REMOVE: "messageReactionRemove"
	};

	if (!events.hasOwnProperty(event.t)) return;

	const { d: data } = event;
	const guild = client.guilds.find(g => g.id === data.guild_id);
	const user = client.users.get(data.user_id);
	const channel = client.channels.get(data.channel_id) || await user.createDM();

	if (events[event.t] === "messageReactionAdd" || events[event.t] === "messageReactionRemove") {
		if (channel.messages.has(data.message_id)) return;

		const message = await channel.fetchMessage(data.message_id);
		const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
		let reaction = message.reactions.get(emojiKey);

		if (!reaction) {
			const emoji = new Discord.Emoji(client.guilds.get(data.guild_id), data.emoji);
			reaction = new Discord.MessageReaction(message, emoji, 1, data.user_id === client.user.id);
		}

		client.emit(events[event.t], reaction, user);
	}
}
