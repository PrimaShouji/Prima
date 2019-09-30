const Discord = require('discord.js');
const fs = require('fs');
const util = require('util');

const { prefix } = require('../config.json');

const readdir = util.promisify(fs.readdir);

module.exports = async (client, logger, message) => {
	logger.log('warn', `Deleted message from ${message.author.tag}: ${message.content}`);

	if (message.type ==="DEFAULT" || message.guild.id === "550702475112480769") {
	    var channel = message.guild.channels.get("592770213657837587");
	    const audit = await message.guild.fetchAuditLogs({
	        limit: 1,
	        type: "MESSAGE_DELETE"
	    });

		const entry = audit.entries.first();
		const executor = (entry &&
						 entry.extra.channel.id === message.channel.id &&
						 entry.target.id === message.author.id &&
						 entry.createdTimestamp > (new Date().getTime() - 10000))
						 	? entry.executor : message.author;

	    if (executor.id === client.user.id || message.content.startsWith(prefix)) {
			channel = message.guild.channels.get("593145966748631053"); // Separate channel for messages related to commands
		}

		// Basic message
		var messageEmbed = new Discord.RichEmbed()
		    .setTitle(`#${message.channel.name}`)
		    .setColor("#0080ff")
		    .setAuthor(message.author.tag, message.author.avatarURL)
		    .setDescription(message.content)
		    .setFooter(`Deleted by: ${executor.tag}`, executor.avatarURL)
		    .setTimestamp();

		// Send attachments, if there were any
        if (message.attachments.size > 0) {
			let fileCache = await readdir('./temp'); // Where we store the images people upload
			let fileIDList = fileCache.map((file) => file = file.substr(0, file.indexOf('.'))); // Get just the file ID, not the extension
			let attachmentString = ""; // Define the text that has all the file links that we didn't store
			message.attachments.array().forEach((attachment) => {
				if (fileIDList.includes(attachment.id)) {
					try { // The try/catch will flip to catch the error if the file doesn't exist
						messageEmbed.attachFile(new Discord.Attachment(`./temp/${fileCache[fileIDList.indexOf(attachment.id)]}`, fileCache[fileIDList.indexOf(attachment.id)]));
					} catch(error) {
						logger.log('error', error);
						attachmentString += "\n" + attachment.url;
					}
				} else {
					attachmentString += "\n" + attachment.url;
				}
			});
			if (attachmentString.length > 0) {
				await channel.send(`Unsaved message attachments linked below. Please be aware that attempting to access deleted files may return 403 Forbidden from the CDN.${attachmentString}`);
			}
        }

		// Send the embed
        const copiedMessage = await channel.send(messageEmbed);

		// Copy reactions as best we can, we unfortunately cannot copy the people who reacted so we just put it after.
        if (message.reactions.size > 0) {
            message.reactions.forEach((reaction) => {
				var usersString = "\n";
				reaction.users.forEach((user, id, map) => {
					usersString += user.tag + "\n";
				});
				copiedMessage.react(reaction.emoji).then((messageReaction) => {
					channel.send(`Users who reacted with ${messageReaction.emoji}:${usersString}`);
				}).catch(async (error) => {
					// If the emoji is an external emoji that this bot does not have access to directly, create the emoji on another server and then subsequently delete it.
					let copyGuild = client.guilds.get("550910482194890781");
					let dupeEmoji = await copyGuild.createEmoji(`https://cdn.discordapp.com/emojis/${reaction.emoji.id}.png`, reaction.emoji.name);
					await copiedMessage.react(dupeEmoji);
					await channel.send(`Users who reacted with ${dupeEmoji}:${usersString}`);
					await copyGuild.deleteEmoji(dupeEmoji).catch((error) => {
						logger.log('error', `The emoji couldn't be deleted.`);
					});
				});
            });
        }
    }
}
