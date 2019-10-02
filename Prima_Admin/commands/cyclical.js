const { prefix, mod_roles } = require('../config.json');

const commontags = require('common-tags');
const cronJob = require('cron').CronJob;
const fs = require('fs');

module.exports = {
	name: 'cyclical',
	description: `Post a message in a channel repeatedly. Using \`${prefix}cyclical stop\` will end the cycle.`,
	usage: `<cronstring>`,
	guildOnly: true,
	args: true,
	execute(client, message, logger, args) {
		// Check if Administrator
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		if (args[0].toLowerCase() === "stop") {
			try {
				client.cronJobs.get(`cyclical.${message.guild.id}.${message.channel.id}`).stop();
				
				fs.unlink(`./cronjobs/cyclical.${message.guild.id}.${message.channel.id}.js`, (err) => {
					if (err) throw err;
					
					message.reply(`cyclical has stopped.`);
				});
			} catch(error) {
				return message.reply(`no cyclical messages were found in this channel.`);
			}
		}
		
		const cronString = `${args[0]} ${args[1]} ${args[2]} ${args[3]} ${args[4]} ${args[5]}`;
		var cycle = ``;
		for (var i = 6; i <= args.length - 2; i++) {
			cycle += args[i] + " ";
		}
		cycle += args[args.length - 1];
		cycle = cycle.replace(/[^a-zA-Z ]/g, "");
		
		try {
			const testCron = new cronJob(cronString, () => {}, null); // See if the constructor errors.
		} catch(error) {
			return message.reply(commontags.stripIndents`
				your cronstring is incorrectly formatted.
				Cronstrings are a series of 6 numbers, ranges, or asterisks.
				Numbers and ranges represent absolute times, and asterisks represent frequencies.
				
				Example: \`0 0 0 * * * blah blah blah\` -> Repeats \`blah blah blah\` every day at 0:00.
			`);
		}
		
		const cronScript =
`const { RichEmbed } = require('discord.js');

module.exports = {
	cronstring: '${cronString}',
	execute(client, logger) {
		try { client.guilds.get("${message.guild.id}"); } catch(e) {}
		
		const guild = client.guilds.get("${message.guild.id}");
		const channel = guild.channels.get("${message.channel.id}");
		
		const embeddable = new RichEmbed()
			.setColor('#0080ff')
			.setDescription("${cycle}");
			
		channel.send(embeddable);
	}
}`;
		
		fs.appendFileSync(`./cronjobs/cyclical.${message.guild.id}.${message.channel.id}.js`, cronScript);
		cronEvent = require(`../cronjobs/cyclical.${message.guild.id}.${message.channel.id}.js`);
		
		client.cronJobs.set(`cyclical.${message.guild.id}.${message.channel.id}`, new cronJob(cronString, () => cronEvent.execute(client, logger), null, true));
		
		message.channel.send(`Cyclical started!`);
	}
}