const { prefix, api_key, timeout_role, mod_roles } = require('../config.json');

const Discord = require('discord.js');
const request = require('request-promise');
const XIVAPI = require('xivapi-js');
const xiv = new XIVAPI({language: 'en'});

module.exports = {
	name: 'theyare',
	cooldown: 0,
	description: `Links a character to someone else's Discord account. Remember to get their permission first (Administrators only).`,
	args: true,
	async execute(client, message, logger, args) {
		function getUserFromMention(mention) {
			if (!mention) return;

			if (mention.startsWith('<@') && mention.endsWith('>')) {
				mention = mention.slice(2, -1);

				if (mention.startsWith('!')) {
					mention = mention.slice(1);
				}

				return mention;
			}
		}

		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;

		message.delete();

		if (args.length !== 4) return message.reply(`please enter that command in the format \`${prefix}theyare @user World Name Surname\`.`).then((msg) => msg.delete(5000));

		const MIN_LEVEL = 70;

		var userID = getUserFromMention(args[0]);
		var world = args[1];
		var name = args[2] + " " + args[3]; // Used for the initial query.

		xiv.character.search(name, { server: world }).then(async (res, err) => {
			const character = res.Results.find((result) => result.Name.toLowerCase() === name.toLowerCase());

			world = world.toLowerCase();
			world = world.charAt(0).toUpperCase() + world.substr(1);
			name = character.Name; // ("")

			const output = new Discord.RichEmbed()
				.setColor('#0080ff')
				.setTitle(`(${world}) ${name}`) // (World) Name Surname
				.setDescription(`Query matched!`)
				.setThumbnail(character.Avatar);

			var dbo = (await client.db).db("prima_db");
			var documentData = { id: userID, world: world, name: name, lodestone: character.ID, avatar: character.Avatar };

			dbo.collection("xivcharacters").findOne({ lodestone: character.ID }, (err, res) => {
				if (res && res.id !== userID) return message.reply(`someone else has already registered that character.`).then((m) => m.delete(5000));

				dbo.collection("xivcharacters").findOne({ id: userID }, async (err, res) => { // Check if an entry exists.
					if (res) {
						dbo.collection("xivcharacters").updateOne({ id: userID }, { $set: { world: world, name: name, lodestone: character.ID, avatar: character.Avatar } }, (err, res) => { // Update if existing.
							if (err) throw err;

							logger.log('info', `prima_db: Updated ${userID}: (${world}) ${name}`);

							db.close();
						});
					} else {
						dbo.collection("xivcharacters").insertOne(documentData, (err, res) => { // Create if nonexistent.
							if (err) throw err;

							logger.log('info', `prima_db: Updated ${userID}: (${world}) ${name}`);

							db.close();
						});
					}

					message.channel.send(output).then((msg) => msg.delete(10000));

					let nickname = `(${world}) ${name}`;
					if (nickname.length > 32) nickname = name;

					(await message.guild.fetchMember(userID)).setNickname(nickname).then((mem) => { // Update their nickname.
						logger.log('info', `Changed <@${userID}>'s nickname to ${nickname}.`);
					}).catch((err) => {
						logger.log('error', `${err}. Are they the server owner?`);
					});
				});
			});
		}).catch((err) => {
			logger.log('error', err);
			message.reply(`an error occurred. Did you spell the World name correctly?`).then(m => m.delete(10000));
		});
	}
}
