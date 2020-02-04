const { prefix, api_key, timeout_role } = require('../config.json');

const Discord = require('discord.js');
const request = require('request-promise');
const XIVAPI = require('xivapi-js');
const xiv = new XIVAPI({language: 'en'});

module.exports = {
	name: 'iam',
	aliases: ["I"],
	cooldown: 0.05,
	description: `Links a character to your Discord account.`,
	args: true,
	execute(client, message, logger, args) {
		function delay(t, val) {
			return new Promise(function(resolve) {
				setTimeout(function() {
					resolve(val);
				}, t);
			});
		}

		if (message.content.slice(1).startsWith("i am")) {
			args.shift();
		}

		message.guild.fetchMember(message.author.id).catch((e) => {}); // An attempt to make it work more often.
		message.delete(5000).catch((e) => {});

		if (args.length !== 3) return message.reply(`please enter that command in the format \`${prefix}iam World Name Surname\`.`).then((msg) => msg.delete(5000));

		const MIN_LEVEL = 60;

		// Sanitation for the initial query.
		var world = args[0].replace(/[^a-zA-Z]/g, "").replace(/(?:courel|couerl)/g, "Coeurl");
		var name = (args[1] + " " + args[2]).replace(/[<>]/g, "").replace(/’/gu, "'");

		xiv.character.search(name, { server: world }).then(async (res, err) => {
			const character = res.Results.find((result) => result.Name.toLowerCase() === name.toLowerCase());

			let ans = JSON.parse(await request(`https://xivapi.com/character/${character.ID}`));

			let meetsLevel = false;

			if (!ans.Character) {
				message.channel.startTyping();
				for (var i = 0; i < 10; i++) {
					ans = JSON.parse(await request(`https://xivapi.com/character/${character.ID}`));
					if (ans.Character) break;
					await delay(1000);
				}
				message.channel.stopTyping();
			}

			try {
				for (job in ans.Character.ClassJobs) {
					let jobID = parseInt(ans.Character.ClassJobs[job].JobID);
					if (jobID < 8 || jobID > 18) {
						if (parseInt(ans.Character.ClassJobs[job].Level) >= MIN_LEVEL) {
							meetsLevel = true;
						}
					}
				}
			} catch(err) {
				return message.reply(`I couldn't access your character data. This may mean your data was just fetched, please try again.`).then(m => m.delete(10000));
			}

			if (!meetsLevel) {
				return message.channel.send(`This is a security notice. <@${message.author.id}>, that character does not have any combat jobs at Level ${MIN_LEVEL}.`).then(m => m.delete(10000));
			}

			// End security

			world = world.toLowerCase();
			world = world.charAt(0).toUpperCase() + world.substr(1);
			name = character.Name; // ("")

			const output = new Discord.RichEmbed()
				.setColor('#0080ff')
				.setTitle(`(${world}) ${name}`) // (World) Name Surname
				.setDescription(`Query matched!`)
				.setThumbnail(character.Avatar);

			var dbo = (await client.db).db("prima_db");
			var documentData = { id: message.author.id, world: world, name: name, lodestone: character.ID, avatar: character.Avatar };

			dbo.collection("xivcharacters").findOne({ lodestone: character.ID }, (err, res) => {
				if (res && res.id !== message.author.id) return message.reply(`someone else has already registered that character.`).then((m) => m.delete(5000));

				if (res && message.member.roles.some(r => ["Cleared", "Arsenal Master"].includes(r.name))) return message.reply(`you have already verified your character.`).then((m) => m.delete(5000));

				dbo.collection("xivcharacters").findOne({ id: message.author.id }, (err, res) => { // Check if an entry exists.
					if (res) {
						dbo.collection("xivcharacters").updateOne({ id: message.author.id }, { $set: { world: world, name: name, lodestone: character.ID, avatar: character.Avatar } }, (err, res) => { // Update if existing.
							if (err) throw err;

							logger.log('info', `prima_db: Updated ${message.author.id}: (${world}) ${name}`);

							db.close();
						});
					} else {
						dbo.collection("xivcharacters").insertOne(documentData, (err, res) => { // Create if nonexistent.
							if (err) throw err;

							logger.log('info', `prima_db: Updated ${message.author.id}: (${world}) ${name}`);

							db.close();
						});
					}

					message.channel.send(output).then((msg) => msg.delete(10000));

					let nickname = `(${world}) ${name}`;
					if (nickname.length > 32) nickname = name;

					message.member.setNickname(nickname).then((mem) => { // Update their nickname.
						logger.log('info', `Changed ${message.member}'s' nickname to ${nickname}.`);
					}).catch((err) => {
						logger.log('error', `${err}. Are they the server owner?`);
					});
				});
			});
		});
	}
}
