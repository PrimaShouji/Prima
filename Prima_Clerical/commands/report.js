const { arsenal_guild_id, report_channel } = require('../config.json');

module.exports = {
	name: 'report',
	args: true,
	noGuild: true,
	cooldown: 5,
	description: `Report something to the Administrators.`,
	execute(client, message, logger, args) {
		report = ''; // Report is the rest of the arguments, we loop through them
		for(var i = 0; i < args.length; i++) {
			report += args[i] + ' ';
		}
		report = report.substr(0, report.length - 1); // Lazy coding to remove the space at the end
		
		guild = client.guilds.get(arsenal_guild_id);
		reportChannel = guild.channels.find(ch => ch.name === report_channel);
		
		message.channel.send(`Thank you for your report. The moderators will read it as soon as they are available.`);
		reportChannel.send(`<@&550704331264098304> ${message.author.tag} just sent a report: ${report}`); // Being lazy rn and just hardcoding it, I can encapsulate this whenever
	}
}