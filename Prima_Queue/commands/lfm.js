const fs = require('fs'); // Enables writing to queues
const commontags = require('common-tags');
const _ = require('lodash');
const Discord = require('discord.js');
const { prefix, lfm_role, lfg_channels, ele_voice_channels, arsenal_server } = require('../config.json');

module.exports = {
	name: 'lfm',
	aliases: ['pull'],
	args: true,
	guildOnly: true,
	cooldown: 3,
	guild: `${arsenal_server}`,
	description: 'Look for up to 7 members for a Baldesion Arsenal run. You will be asked to enter a non-leader voice chat room before the search begins, after which you will recieve the password for your party.',
	usage: '<[#d][#h][#t]>, e.g. 4d2h1t for 4 DPS, 2 Healers, and 1 Tank, or 3d for 3 DPS.',
	execute(client, message, logger, args) {
		//
		// FUNCTION DECLARATIONS
		//

		function clone(a) {
			return JSON.parse(JSON.stringify(a));
		}

		function addLFM() {
			message.member.addRole(message.guild.roles.find(role => role.name === lfm_role));
		}

		function removeLFM() {
			message.member.removeRole(message.guild.roles.find(role => role.name === lfm_role));
		}

		//
		// PREPROCESSING
		//
		var pullLog = fs.readFileSync(`queues/PullLog.log`).toString().match(/\d+/g);
		if (!pullLog) pullLog = [];
		now = new Date();
		if (message.member.roles.has(message.guild.roles.find(role => role.name === lfm_role).id) && pullLog.indexOf(message.author.id) !== -1) {
			if (parseInt(pullLog[pullLog.indexOf(message.author.id) - 1]) + 30000 <= now.getTime()) { // Last pulled more than 30 seconds ago
				message.reply(`something went wrong in your last pull and you weren't properly deregistered, so I tried to deregister you again. Please try pulling again.`);
				removeLFM();
				logger.log('error', `Something went wrong, removing LFM role now.`);
				pullLog.splice(pullLog.indexOf(message.author.id) - 1, 2);
				fs.writeFileSync(`queues/PullLog.log`, `${pullLog.join()},`);
				return;
			} else {
				message.reply(`you are already looking for members.`);
				logger.log('error', `${message.author.tag} is already looking for members.`);
				return;
			}
		} else {
			if (pullLog.indexOf(message.author.id) !== -1) {
				pullLog.splice(pullLog.indexOf(message.author.id) - 1, 2);
				fs.writeFileSync(`queues/PullLog.log`, `${pullLog.join()},`);
			}
			fs.appendFileSync(`queues/PullLog.log`, `${now.getTime()},${message.author.id},`);
		}

		var dps = 0;
		var healers = 0;
		var tanks = 0;

		var fixedroles = args.join(); // This makes it work even if it has spaces between args, like "lfm 1d 1h 2t"
		var channel = message.channel.name;
		var inEleChannel = true;
		var inArsenal = true;

		if (lfg_channels.indexOf(channel) === -1) return; // Don't use this outside of lfg channels

		var partyType = ''; // channel name formatted for output
		if(channel == lfg_channels[0]) partyType = 'learning/frag farming';
		if(channel == lfg_channels[1]) partyType = 'Absolute Virtue or Ozma prog';
		if(channel == lfg_channels[2]) partyType = 'Ozma clears or farms';

		addLFM();

		// Figure out how many of each role the leader wants
		if (fixedroles.search('d') !== -1) {
			dps = parseInt(fixedroles[fixedroles.indexOf('d') - 1]);
		}
		if (fixedroles.search('h') !== -1) {
			healers = parseInt(fixedroles[fixedroles.indexOf('h') - 1]);
		}
		if (fixedroles.search('t') !== -1) {
			tanks = parseInt(fixedroles[fixedroles.indexOf('t') - 1]);
		}

		// Error handling
		if (isNaN(dps + healers + tanks)) { // In case someone slides by by typing ~lfm c or something
			message.reply('something went wrong... Next time, make sure you enter a valid role identifier, such as "d" or "healer", and a non-negative number before each.');
			removeLFM();
			return;
		} else if (dps + healers + tanks > 7) {
			message.reply('you can\'t have more than 8 people in a party (including yourself) :eyes:');
			removeLFM();
			return;
		} else if (dps + healers + tanks <= 0) {
			message.reply('your party can\'t be empty :confused:');
			removeLFM();
			return;
		}

		message.reply(commontags.stripIndents`
			you have begun a search for ${dps} DPS, ${healers} Healer(s), and ${tanks} Tank(s).
			Party Finder information will be DM'd to you immediately.
			Arsenal information will be sent to invitees after 30 seconds.
			You can cancel matchmaking by typing \`${prefix}stop\` within 30 seconds.
		`);

		// Wait for a stop message
		const filter = m => m.content.includes(`${prefix}stop`) && m.author.id === message.author.id;
		const collector = message.channel.createMessageCollector(filter, { time: 29500 }); // We set the time to be just shy of 30 seconds to avoid async-related bugs
		stopped = false;

		collector.on('collect', m => {
			if (m.author.id === message.author.id) {
				logger.log('info', `${message.author.tag}'s matchmaking attempt has been cancelled (${prefix}stop).`);
				message.reply(`your matchmaking attempt has been cancelled.`);
				stopped = true;
				removeLFM();
			}
		});

		// Password generation redacted
		const pw = "0000";

		// DM to lead
		logger.log('info', `${message.author.tag} executed LFM for ${dps} DPS, ${healers} healer(s), and ${tanks} tank(s), password ${pw}.`);
		message.author.send(commontags.stripIndents`
			Your Party Finder password is ${pw}.
			Please join an elemental voice channel within the next 30 seconds to continue matching.
			Create the listing in Party Finder now; matching will begin in 30 seconds.
		`).catch((e) => {
			logger.log('error', `Couldn't DM ${message.author.tag}. Notifying in queue channel.`);
			removeLFM();
			message.reply(`You seem to have your DMs disabled. Please enable them temporarily, and then reattempt to use the command.`);
			stopped = true;
			return;
		});

		// Waiting 30 seconds
		setTimeout (() => {
			function sendMessageToUser(id, content) {
				var user = client.users.get(id);

				user.send(content).then((m) => {
					logger.log('info', `${user.tag} was sent an invitee embed.`);
				}).catch((e) => {
					logger.log('info', `${user.tag} invite failed. Notifying in queue channel.`);
					message.reply(`${user} is a member of your party but couldn't be messaged. Please share your party information with them.`);
				});
			}

			function sendMessageToLeader(content) {
				var leader = message.author;

				leader.send(content).then((m) => {
					logger.log('info', `${leader.tag} was sent a leader embed.`);
				}).catch((e) => {
					logger.log('info', `${leader.tag} message failed. Notifying in queue channel.`);
					message.reply(`I couldn't DM you! Do you have DMs disabled?`);
				});
			}

			function removeFromQueue(id, role, callback) {
				var queue = client.BAqueues.get(`${channel}.${role}`);

				if(queue.indexOf(id) !== -1){
					queue.splice(queue.indexOf(id) - 1, 2);

					callback('Success.');
				} else {
					callback('No instances found.');
				}
			}

			function removeFromAllQueues(id, callback) {
				const roleList = ["dps", "healer", "tank"];
				for (ch of lfg_channels) {
					for (r of roleList) {
						var queue = client.BAqueues.get(`${ch}.${r}`);

						if(queue.indexOf(id) !== -1){
							queue.splice(queue.indexOf(id) - 1, 2);
						}
					}
				}

				callback('Done.');
			}

			function deQueueMembers(role, amount, usedIDs, callback) {
				var mem = [];

				if (amount === 0) {
					callback(mem);
					return;
				}

				var queue = client.BAqueues.get(`${channel}.${role}`);

				if (!queue) callback(mem);

				var i = 0;
				var j = 0;
				while (i < amount) {
					if (queue[j]) {
						if (usedIDs.indexOf(queue[j]) === -1 && client.users.get(queue[j])) {
							mem[i] = queue[j];
							i++;
							j++;
						} else {
							j++;
						}
					} else {
						amount--;
					}
				}

				queue = queue.splice(0, j);

				callback(mem);
			}

			removeLFM();

			var vcName = '';

			if (stopped) { // if stop was entered over the 30 seconds
				return;
			}
			if (!message.member.voiceChannel || message.member.voiceChannel.parent.name.toLowerCase().indexOf('arsenal') === -1) {
				inArsenal = false;
				inEleChannel = false;
			} else if (!message.member.voiceChannel.name) {
				inEleChannel = false;
			} else {
				inEleChannel = false;
				for (eleChannel of ele_voice_channels) {
					if (message.member.voiceChannel.name.indexOf(eleChannel) !== -1) {
						vcName = message.member.voiceChannel.name;
						inEleChannel = true;
					}
				}
			}

			var counter = 0;

			var shownLeaderName = message.member.nickname; // the leader name doesn't work if they don't have a nickname set, so we process it
			if(shownLeaderName === null) shownLeaderName = message.author.username;

			// Remove leader from queues.
			removeFromAllQueues(message.author.id, (res) => { counter++; });

			logger.log('info', `${message.author.tag} has been removed from queues in ${channel}.`);

			var mem_d, mem_h, mem_t; // Array of IDs of users found

			deQueueMembers("tank", tanks, [], (res) => {
				mem_t = res;
				for (t of mem_t) {
					removeFromAllQueues(t, (res) => { });
				}
				deQueueMembers("healer", healers, mem_t, (res) => {
					mem_h = res;
					for (h of mem_h) {
						removeFromAllQueues(h, (res) => { });
					}
					deQueueMembers("dps", dps, mem_t.concat(mem_h), (res) => {
						mem_d = res;
						for (d of mem_d) {
							removeFromAllQueues(d, (res) => { });
						}
						reporting();
					});
				});
			});

			function reporting() {
				if (!mem_d || !mem_h || !mem_t) return;

				if (mem_d.length + mem_h.length + mem_t.length === 0) {
					message.reply(`the queues you're trying to pull from are empty!`);
					return;
				}

				// logger.log('info', `${mem_d.toString()}, ${mem_h.toString()}, ${mem_t.toString()}`);

				tPush = ''; // Make formatted strings of arrays to output
				hPush = '';
				dPush = '';

				for (t of mem_t) {
					var user = message.guild.members.find(u => u.id === t);
					if (user.nickname) {
						tPush = `${tPush}${user} (${user.nickname})\n`;
					} else {
						tPush = `${tPush}${user} (${user.user.tag})\n`;
					}
				}
				for (h of mem_h) {
					var user = message.guild.members.find(u => u.id === h);
					if (user.nickname) {
						hPush = `${hPush}${user} (${user.nickname})\n`;
					} else {
						hPush = `${hPush}${user} (${user.user.tag})\n`;
					}
				}
				for (d of mem_d) {
					var user = message.guild.members.find(u => u.id === d);
					if (user.nickname) {
						dPush = `${dPush}${user} (${user.nickname})\n`;
					} else {
						dPush = `${dPush}${user} (${user.user.tag})\n`;
					}
				}

				logger.log('info', commontags.stripIndents`
				${message.author.tag}'s Members:
					DPS:
						${dPush}
					Healers:
						${hPush}
					Tanks:
						${tPush}
				`);

				leaderEmbed = new Discord.RichEmbed() // Make the fancy panel like the one Meka has owo
					.setColor('#0080ff')
					.setTitle('Invited the following people:')
					.setThumbnail('https://i.imgur.com/4ogfA2S.png');
				if (mem_t.length > 0) leaderEmbed.addField('Tanks', tPush, false)
				if (mem_h.length > 0) leaderEmbed.addField('Healers', hPush, false)
				if (mem_d.length > 0) leaderEmbed.addField('DPS', dPush, false);
				leaderEmbed.addField(`Someone didn't show?`,
					`If some/all of these people don't show up or respond to messages, feel free to run the command again (with the new party requirements) to fill your party. The PF password will stay the same until midnight PDT.`, false);
				if (dps + healers + tanks != mem_t.length + mem_h.length + mem_d.length) leaderEmbed.addField('NOTICE:',
					`The queues you selected ran out of members of the roles you asked for. Feel free to use the notifiable roles to fill the rest of your party.`, false);
				sendMessageToLeader(leaderEmbed);

				// Member DMs
				for (t of mem_t) {
					var inviteeEmbed = new Discord.RichEmbed() // Make the fancy panel like the one Meka has owo
						.setColor('#0080ff')
						.setTitle('Your queue has popped!')
						.setDescription(`Your queue for ${partyType} has popped! Check the PF for a party under \`${shownLeaderName}\` (or something similar) and use the password \`${pw}\` to join! `
							+ `Please DM them (${message.author.tag}) if you have issues with joining or cannot find the party. `
							+ `Additionally, the map used to find your portal location can be found here: https://i.imgur.com/Gao2rzI.jpg`)
						.addField('Group', `${inArsenal ? message.member.voiceChannel.parent.name.substring(0) : 'Ask your party leader!'}`, true)
						.addField('Voice Channel', `${inEleChannel ? vcName : 'Ask your party leader!'}`, true)
						.addField('Your Role', `Tank`, true)
						.setThumbnail('https://i.imgur.com/4ogfA2S.png');
					sendMessageToUser(t, inviteeEmbed);
				}
				for (h of mem_h) {
					var inviteeEmbed = new Discord.RichEmbed() // Make the fancy panel like the one Meka has owo
						.setColor('#0080ff')
						.setTitle('Your queue has popped!')
						.setDescription(`Your queue for ${partyType} has popped! Check the PF for a party under \`${shownLeaderName}\` (or something similar) and use the password \`${pw}\` to join! `
							+ `Please DM them (${message.author.tag}) if you have issues with joining or cannot find the party. `
							+ `Additionally, the map used to find your portal location can be found here: https://i.imgur.com/Gao2rzI.jpg`)
						.addField('Group', `${inArsenal ? message.member.voiceChannel.parent.name.substring(0) : 'Ask your party leader!'}`, true)
						.addField('Voice Channel', `${inEleChannel ? vcName : 'Ask your party leader!'}`, true)
						.addField('Your Role', `Healer`, true)
						.setThumbnail('https://i.imgur.com/4ogfA2S.png');
					sendMessageToUser(h, inviteeEmbed);
				}
				for (d of mem_d) {
					var inviteeEmbed = new Discord.RichEmbed() // Make the fancy panel like the one Meka has owo
						.setColor('#0080ff')
						.setTitle('Your queue has popped!')
						.setDescription(`Your queue for ${partyType} has popped! Check the PF for a party under \`${shownLeaderName}\` (or something similar) and use the password \`${pw}\` to join! `
							+ `Please DM them (${message.author.tag}) if you have issues with joining or cannot find the party. `
							+ `Additionally, the map used to find your portal location can be found here: https://i.imgur.com/Gao2rzI.jpg`)
						.addField('Group', `${inArsenal ? message.member.voiceChannel.parent.name.substring(0) : 'Ask your party leader!'}`, true)
						.addField('Voice Channel', `${inEleChannel ? vcName : 'Ask your party leader!'}`, true)
						.addField('Your Role', `DPS`, true)
						.setThumbnail('https://i.imgur.com/4ogfA2S.png');
					sendMessageToUser(d, inviteeEmbed);
				} // We don't factor out the embed because we need to have slightly different information each time, so we'd need to copy the base version, and object copies can be a nightmare
			}
		}, 30000); // The time to wait for the leader to get set up (30 seconds in ms)
	},
};
