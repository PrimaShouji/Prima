const Discord = require('discord.js');
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

module.exports = async (client, logger, event) => {
	const events = {
		MESSAGE_REACTION_ADD: 'messageReactionAdd',
		MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
		MESSAGE_DELETE: 'messageDelete'
	};

	if (!events.hasOwnProperty(event.t)) return;

	const { d: data } = event;
	const guild = client.guilds.find(g => g.id === data.guild_id);
	const user = client.users.get(data.user_id);
	const channel = client.channels.get(data.channel_id) || await user.createDM();

	if (events[event.t] === 'messageReactionAdd' || events[event.t] === 'messageReactionRemove') {
		if (channel.messages.has(data.message_id)) return;

		const message = await channel.fetchMessage(data.message_id);
		const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
		let reaction = message.reactions.get(emojiKey);

		if (!reaction) {
			const emoji = new Discord.Emoji(client.guilds.get(data.guild_id), data.emoji);
			reaction = new Discord.MessageReaction(message, emoji, 1, data.user_id === client.user.id);
		}

		client.emit(events[event.t], reaction, user);
	} else {
		if (channel.messages.has(data.id)) return; // The message exists in the cache, so the event was fired normally

		let bigCache = JSON.parse((await readFile(`bigCache.json`)).toString());
		if (!bigCache[data.id]) return;

		// Now we construct literally everything.
		const cancelledUser = client.users.get(bigCache[data.id].userid);

		const messageData = {
			id: data.id,
			channel: channel,
			guild: guild,
			type: "DEFAULT",
			content: bigCache[data.id].content,
			author: cancelledUser,
			pinned: bigCache[data.id].pinned,
			tts: bigCache[data.id].tts,
			nonce: bigCache[data.id].nonce,
			reactions: new Discord.Collection(), // There's no point in updating the entry every time a reaction is added, so I'm not going to do that. It's a rarely useful feature anyways, not going to write spaghetti code just to keep it for uncached messages.
			embeds: new Discord.Collection(),
			attachments: new Discord.Collection(),
			createdTimestamp: bigCache[data.id].timestamp,
			mentions: new Discord.Collection(),
			mention_roles: new Discord.Collection(),
			mention_everyone: bigCache[data.id].mention_everyone
		};

		for (attachment in bigCache[data.id]._attachments) {
			if (bigCache[data.id]._attachments.hasOwnProperty(attachment)) {
				messageData.attachments.set(attachment, new Discord.MessageAttachment(client, {
					id: attachment,
					filename: bigCache[data.id]._attachments[attachment].name,
					url: bigCache[data.id]._attachments[attachment].file
				}));
			}
		}

		for (user of bigCache[data.id]._mentions) {
			messageData.mentions.set(user.id, client.users.get(user.id));
		}

		for (role of bigCache[data.id]._mention_roles) {
			messageData.mention_roles.set(role.id, guild.roles.get(role.id));
		}

		client.emit(events[event.t], messageData); // We don't even need to make an actual message object, we just need a data structure
	}
}
