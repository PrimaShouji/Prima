const Discord = require('discord.js');
const fs = require('fs');
const gm = require('gm');
const lockfile = require('lockfile');
const request = require('request-promise');
const XIVAPI = require('xivapi-js');

const { prefix, mod_roles, api_key } = require('../config.json');

module.exports = async (client, logger, message) => {
	// Saving the message with a callback because I don't want to block the command loop with this
	// note: This fires on messages in guild channels only, not DMs. DM commands are logged, however.
	lockfile.lock(`bigCache.lock`, (err) => {
		if (err) {
			logger.log('error', err);
			return;
		}

		fs.readFile(`bigCache.json`, (err, messageData) => {
			if (err) {
				logger.log('error', err);
				return;
			}

			if (message.type !== "DEFAULT") return;

			var messageData = JSON.parse(messageData.toString());
			messageData[message.id] = {
				userid: message.author.id,
				content: message.content,
				pinned: message.pinned,
				tts: message.tts,
				nonce: message.nonce,
				_attachments: {},
				createdTimestamp: message.timestamp,
				_mentions: [],
				_mention_roles: [],
				mention_everyone: message.mention_everyone
			};

			message.attachments.forEach((attachment, id, map) => {
				let fileExtension = attachment.filename.substr(attachment.filename.lastIndexOf('.') + 1).toLowerCase();

				request(attachment.url).on('error', (err1) => { // Get image from URL
					logger.log('error', `Couldn't GET ${attachment.url}, ignoring (${err1}).`);
				}).pipe(fs.createWriteStream(`temp/${id}.${fileExtension}`)).on('finish', () => {
					logger.log('info', `Saved attachment ${id}.${fileExtension}.`);
				});

				messageData[message.id]._attachments[id] = {
					file: attachment.url,
					name: attachment.filename
				};
			});

			for (user of message.mentions.users) {
				messageData[message.id]._mentions.push(user.id);
			}

			for (role of message.mentions.roles) {
				messageData[message.id]._mention_roles.push(role.id);
			}

			fs.writeFile(`bigCache.json`, JSON.stringify(messageData), (err) => {
				if (err) logger.log('error', err);

				lockfile.unlock(`bigCache.lock`, (err) => {
					if (err) logger.log('error', err);
				});
			});
		});
	});

	if (message.author.id === client.user.id) return; // Self-commands disabled.

	// Add data to database
	const xiv = new XIVAPI({private_key: `${api_key}`, language: 'en'});
	var dbo = (await client.db).db("prima_db");

	dbo.collection("xivcharacters").findOne({ id: message.author.id }, async (err, res) => {
		if (!res || !message.member.nickname) return;

		if (!res.name || !res.world) {
			await dbo.collection("xivcharacters").insertOne({ id: message.author.id });
			res.name = message.member.nickname.substr(message.member.nickname.indexOf(")") + 1);
			res.world = message.member.nickname.substr(1, message.member.nickname.indexOf(")"));
		} else if (message.author.id === "206937283448799233" && res.name && message.member.nickname.indexOf(res.name) === -1) {
			// I really don't want to deal with this, the bot can do it perfectly fine
			let world = message.member.nickname.substr(1, message.member.nickname.indexOf(")") - 1);
			await message.member.setNickname(`(${world}) ${res.name}`).catch((e) => {
				if (res.world) {
					message.member.setNickname(`(${res.world}) ${res.name}`);
				}
			});
		}

		if (!res.lodestone || !res.avatar) {
			logger.log("info", res.world + " " + res.name);

			xiv.character.search(res.name, { server: res.world }).then(async (search) => {
				const character = search.Results[0] // First result is probably the best result.

				await dbo.collection("xivcharacters").updateOne({ id: message.author.id }, { $set: { world: character.Server, name: character.Name, lodestone: character.ID, avatar: character.Avatar } });

				logger.log('info', `prima_db: Updated ${message.author.id}: ${character.ID}, ${character.Avatar}`);

			}).catch((error) => {
				return logger.log('error', `${res.world} isn't a valid server.`);
			});
		}
	});

	if (message.guild) {
		await message.guild.fetchMember(message.author.id);
	}

	// Strictly blacklisted text
	const CBA_BLACKLIST = [
		"https://tenor.com/view/sohungry-sogood-yummy-food-foodisgood-gif-5571042",
		"nigger"
	];

	if (message.guild && message.guild.id === "550702475112480769") {
		for (text of CBA_BLACKLIST) {
			if (message.content.includes(text)) {
				var messageEmbed = new Discord.RichEmbed()
        				.setTitle(`#${message.channel.name}`)
        				.setColor("#0080ff")
     					.setAuthor(`${message.author.tag}`, message.author.avatarURL)
     					.setDescription(message.content)
					.setFooter(`Deleted by: ${client.user.tag}`, client.user.avatarURL)
	   				.setTimestamp();

				message.guild.channels.get("592770213657837587").send(messageEmbed);
				return message.delete();
			}
		}
	}

	// Verification
	if (message.channel.name === 'welcome') {
		if (message.author.id !== client.user.id && !message.guild.members.find(mem => mem.id === message.author.id).roles.some(roles => mod_roles.includes(roles.name))) {
			message.delete(5000);
		}
	}

	// Attachment processing
	if (message.attachments.size > 0) {
		message.attachments.forEach((value, key, map) => {
			const justFilename = value.filename.substr(0, value.filename.lastIndexOf('.'));
			const fileExtension = value.filename.substr(value.filename.lastIndexOf('.') + 1).toLowerCase();

			if (fileExtension === `bmp`) { // BMP files don't automatically render in Discord
				logger.log('info', `Got BMP file ${value.url} from ${message.author.tag}, processing...`)

				const before = new Date();

				request(value.url).on('error', (err1) => { // Get image from URL
					logger.log('error', `Couldn't GET ${value.url}, ignoring (${err1}).`);
				}).pipe(fs.createWriteStream(`temp/${value.filename}`)).on('finish', () => { // Save
					gm(`${__dirname}/../temp/${value.filename}`).write(`${__dirname}/../temp/${justFilename}.png`, (err2) => { // Convert
						if (err2) logger.log('error', err2);

						message.delete();

						message.channel.send(`${message.author}: Your file has been automatically converted from BMP to PNG (BMP files don't render automatically).`,
												new Discord.Attachment(`temp/${justFilename}.png`)).then((msg) => { // Send
							logger.log('info', `Processed BMP from ${message.author.tag} (t=${new Date().getTime() - before.getTime()}ms)!`);

							fs.unlink(`temp/${value.filename}`, (err3) => { // Delete original
								if (err3) logger.log('error', err3);
							});
							fs.unlink(`temp/${justFilename}.png`, (err3) => { // Delete converted
								if (err3) logger.log('error', err3);
							});
						});
					});
				});
			}
		});
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
