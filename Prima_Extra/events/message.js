const Discord = require('discord.js');
const fs = require('fs');
const gm = require('gm');
const request = require('request');
const { prefix, mod_roles } = require('../config.json');

module.exports = async (client, logger, message) => {
	if (message.author.id === client.user.id) return; // Self-commands disabled.

	if (message.guild) {
		await message.guild.fetchMember(message.author.id);
	}
	
	// ??
	if (message.content.indexOf(`┻━`) !== -1) {
		message.channel.send(`┬──┬*ﾉ(° -°ﾉ)`);
	} else if(message.content.toLowerCase() === "pepega") {
		message.delete();
		return message.channel.send(`<:pepega:582431754451943434>`);
	}
	
	if (message.content.toLowerCase().indexOf(`scholar`) !== -1 ||
		message.content.toLowerCase().indexOf(` sch `) !== -1 ||
		message.content.toLowerCase().indexOf(`:sch:`) !== -1 ||
		message.content.toLowerCase().substr(0, 4) === `sch ` ||
		message.content.toLowerCase().substr(message.content.length - 4, message.content.length) === ` sch` ||
		message.content.toLowerCase() === `sch`) {
		message.react(client.emojis.get("573531927613800459"));
	}
	
	// Command handler
	if (!message.content.startsWith(prefix)) return; // Don't execute code past this point if the message is not a command

	const args = message.content.slice(prefix.length).split(/\s/g); // Cut off the prefix, separate command into words
	const commandName = args.shift().toLowerCase(); // cAmEl CaSe Is GoOd CiViLiZaTiOn
	
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return; // If the command isn't a known command or command alias then return
	
	logger.log('info', `${message.author.tag}: ${message}`);
	
	if (command.guildOnly && message.channel.type !== 'text') { // If a guild command is used outside of a guild
		return message.reply('I can\'t execute that command inside DMs!');
	} else if (command.noGuild && message.channel.type === 'text') { // If a non-guild command is used in a guild
		message.delete();
		return message.reply(`please only use that command in DMs.`).then((m) => m.delete(5000));
	}
	
	if (command.guild && command.guild !== message.guild.name) return; // If a guild-specific command is used outside of that guild, do nothing.
	
	if (command.args && !args.length) { // Command that requires args is entered without args
		let reply = `You didn't provide any arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	}
	
	if (!client.cooldowns.has(command.name)) {
		client.cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = client.cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 0) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before using the \`${command.name}\` command.`);
		}
	}
	
	timestamps.set(message.author.id, now); // Remove a command from the cooldown list if for whatever reason it hasn't automatically been removed
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	
	try {
		command.execute(client, message, logger, args); // Use the command
	} catch (e) {
		logger.log('error', `Error ${e} in command ${prefix}${command.name}, used by ${message.author.tag}. Printing stack trace: ${e.stack}`);
	}
}