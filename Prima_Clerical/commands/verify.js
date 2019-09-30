const commontags = require('common-tags');

const { prefix, api_key, arsenal_server, arsenal_guild_id, clear_role, error_channel } = require('../config.json');

const request = require('request-promise');
const XIVAPI = require('xivapi-js');
const xiv = new XIVAPI({private_key: api_key, language: 'en'});

module.exports = {
	name: 'verify',
	aliases: ['lverify'],
	description: `Have your Lodestone profile scanned to verify that you've cleared the Baldesion Arsenal. You'll get a sticker if you have.`,
	noGuild: true,
	cooldown: 1,
	async execute(client, message, logger, args) {
		function errorMessage(n) {
			if (n === 0) return `Err... actually, you weren't even found in ${arsenal_server}. Please notify an administrator if this is in error.`;
			if (n === 1) return `You are already verified.`;
		}

		const dbURL = `mongodb://localhost:27017/`;

		// Pull Lodestone ID from database
		client.db.connect(dbURL, { useNewUrlParser: true }, (err, db) => {
			if (err) throw err;

			var dbo = db.db("prima_db");

			dbo.collection("xivcharacters").findOne({ id: message.author.id }, async (err, res) => {
				if (!res) return message.reply(`you don't seem to have registered your character yet. Register your character with \`~iam World Name Surname\` before using this command.`);

				if (!res.lodestone || !res.avatar) {
					var search;
					try {
						search = await xiv.character.search(res.name, { server: res.world });
					} catch(error) {
						return message.reply(`your stored world data was lost in a enourmous wildfire spanning twenty thousand acres of land, over the course of merely two days in the absence of firefighters who cared enough to put it out. Please use \`~iam World Firstname Lastname\` again to repair your database entry.`);
					}
					const character = search.Results[0] // First result is probably the best result.

					await dbo.collection("xivcharacters").updateOne({ id: message.author.id }, { $set: { world: character.Server, name: character.Name, lodestone: character.ID, avatar: character.Avatar } });

					logger.log('info', `prima_db: Updated ${message.author.id}: ${character.Avatar}`);
				}

				res = await dbo.collection("xivcharacters").findOne({ id: message.author.id });

				const lodestoneID = res.lodestone;

				// Get Crystal BA by ID
				guild = client.guilds.get(arsenal_guild_id);
				errorChannel = guild.channels.find(ch => ch.name === error_channel);

				var ozKillerID = "583783761490083847";
				var ozKiller = "Arsenal Master";

				// Debug
				logger.log('info', `${message.author.tag} is now attempting to get verified (${lodestoneID}).`);

				if ((await guild.fetchMember(message.author.id)).roles.has(guild.roles.get(ozKillerID))) {
					message.author.send(errorMessage(1));
					return;
				}

				if (`${message.author.id}` === `${lodestoneID}`) {
					message.author.send(`Your Lodestone ID is the number in your FFXIV character profile URL, not your Discord ID.`);
					return;
				}

				// XIVAPI call
				//xiv.character.get(lodestoneID, { columns: "Character.Bio" }).then((response) => {
				let response = JSON.parse(await request(`https://xivapi.com/character/${lodestoneID}?columns=Character.Bio`));
					if (!response || !response.Character.Bio.includes(message.author.id)) {
						logger.log("info", `(${message.author.tag}) Discord ID not found (${lodestoneID}).`);
						message.author.send("Discord ID not found. Please try again in a few minutes after the API has updated."); // They didn't put their ID in the description.
						return;
					}

					logger.log("info", `(${message.author.tag}) Discord ID matched, searching through character data...`);
					message.author.send("Discord ID matched. Searching through character data...");

					// Search through achievements
					request(`https://xivapi.com/character/${lodestoneID}?data=AC`).then(async (response) => {
						response = JSON.parse(response);
						for (let key of response.Achievements.List) {
							if (!response.Achievements.List.hasOwnProperty(key)) continue;
							key = response.Achievements.List[key];
							if (key.ID === 2229) { // If this check succeeds then we don't need to check for Demi-Ozma
								var out = "\"We're on Your Side III\" has been found. ";

								if ((await guild.fetchMember(message.author.id)).roles.has(guild.roles.find(role => role.name === clear_role).id)) {
									(await guild.fetchMember(message.author.id)).addRole(guild.roles.get(ozKillerID))
									.catch((error) => { // Maybe they were banned? Who knows why this would fail.
										errorChannel.send(`${message.author.tag} (${message.author.id}) used ${prefix}verify, but weren't found in the server.`);
										message.author.send(errorMessage(0));
									});
									message.author.send(out + "You have been given the " + ozKiller + " role.");
									logger.log('info', `${message.author.tag} was added to ${ozKiller}.`);
								} else {
									(await guild.fetchMember(message.author.id)).addRole(guild.roles.get(ozKillerID))
									.catch((error) => { // Maybe they were banned? Who knows why this would fail.
										errorChannel.send(`${message.author.tag} (${message.author.id}) used ${prefix}verify, but weren't found in the server.`);
										message.author.send(errorMessage(0));
									});
									(await guild.fetchMember(message.author.id)).addRole(guild.roles.find(role => role.name === clear_role));
									message.author.send(out + "You have been given the " + ozKiller + " role and the " + clear_role + " role.");
									logger.log('info', `${message.author.tag} was added to ${clear_role} and ${ozKiller}.`);
								}

								return;
							}
						}
					})
					.catch((err) => {
						logger.error(err);
						logger.log('info', `${message.author.tag} has their achievements privitized. Skipping...`);
					});
					// Search through mounts
					request(`https://xivapi.com/character/${lodestoneID}?data=MiMo`).then(async (response) => {
						response = JSON.parse(response);
						for (let mount in response.Mounts) {
							if (!response.Mounts.hasOwnProperty(mount)) continue;
							mount = response.Mounts[mount];
							if (mount.Name === "Demi-Ozma") {
								message.author.send(`The mount has been found, and you have been given the ${clear_role} role.`);

								(await guild.fetchMember(message.author.id)).addRole(guild.roles.find(role => role.name === clear_role))
								.catch((error) => { // Maybe they were banned? Who knows why this would fail.
									errorChannel.send(`${message.author.tag} (${message.author.id}) used ${prefix}verify, but weren't found in the server.`);
									message.author.send(errorMessage(0));
								});

								logger.log('info', `${message.author.tag} was added to ${clear_role}.`);
								errorChannel.send(`${message.author.tag} was added to ${clear_role}.`);
								return;
							}
						}

						errorChannel.send(`${message.author.tag} (${message.author.id}) used ${prefix}verify, but I couldn't find the mount or achievement. Lodestone ID ${lodestoneID}.`);
						message.author.send(`The mount/achievement was not found. If you recently cleared for the first time, please keep in mind that the API can take up to 24 hours to update.`);
					})
					.catch((error) => {
						logger.error(error);
						errorChannel.send(`${message.author.tag} (${message.author.id}) used ${prefix}verify, but an error occured while searching their character data. Lodestone ID ${lodestoneID}.`);
						message.author.send(`An error occured while searching your character data.`);
						logger.log('error', `An error occured while searching the character data of ${message.author.tag}, Discord ID ${message.author.id} and Lodestone ID ${lodestoneID}.`);
					});
				/*})
				.catch((error) => {
					logger.log('error', error);
					try {
						if (error.toString().indexOf(`The character you are trying to verify has not yet been added to XIVAPI.`) !== -1) { // XIVAPI is updating.
							errorChannel.send(`XIVAPI is updating ${message.author.tag}'s data. This is generally an instantaneous process.`);
							message.author.send(`XIVAPI is updating your data. This is generally an instantaneous process. Please use the command again in a few seconds.`);
							logger.log('error', `Updating ${message.author.tag}, Discord ID ${message.author.id} and Lodestone ID ${lodestoneID} (${error}).`);
						} else if (error.toString().indexOf(`blacklisted`) !== -1) { // Blacklisted from XIVAPI.
							errorChannel.send(commontags.stripIndents`
								${message.author.tag} (${message.author.id}) is blacklisted from XIVAPI but used ${prefix}verify.
								Their data will not be updated, and they need manual assistance.
							`);
							message.author.send(`You are currently blacklisted from XIVAPI. Please notify an Administrator for manual assistance.`);
							logger.log('error', `Can't verify ${message.author.tag}. Discord ID ${message.author.id} and Lodestone ID ${lodestoneID} is blacklisted from XIVAPI.`);
						}
					} catch(e) {
						errorChannel.send(`${message.author.tag} (${message.author.id}) used ${prefix}verify, but an error occured while looking for their Lodestone profile (${error}). Lodestone ID ${lodestoneID}.`).then((m) => {
							errorChannel.send(`-> ${e}`);
						});
						message.author.send(`An error occured while looking up that ID.`);
						logger.log('error', `An error occured while looking up ${message.author.tag}, Discord ID ${message.author.id} and Lodestone ID ${lodestoneID} (${error}) (${e}).`);
					}
				});*/
			});
		});
	}
}
