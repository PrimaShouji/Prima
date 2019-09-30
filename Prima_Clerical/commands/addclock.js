const fs = require('fs');
const commontags = require('common-tags');
const cronJob = require('cron').CronJob;
const { prefix, mod_roles, arsenal_guild_id, error_channel } = require('../config.json');

module.exports = {
	name: 'addclock',
	description: `Turns a voice channel into a clock :clock1:`,
	args: true,
	execute(client, message, logger, args) {
		message.delete();
		
		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;
		
		guildID = message.guild.id;
		const timezone = args[1].replace(/[^a-zA-Z_\/+0-9-]/g, "");
		const channel = args[0].replace(/[^a-zA-Z]/g, "");		
		guild = client.guilds.get(arsenal_guild_id);
		errorChannel = guild.channels.find(ch => ch.name === error_channel);
		
		if (!args[0] || !args[1] || !parseInt(channel) || timezone.indexOf('/') === -1) {
			errorChannel.send(commontags.stripIndents`
				<@${message.author.id}>, one or more arguments were misformatted or nonexistent.
				Please try again, checking to make sure all arguments were entered correctly.
				Usage: \`${prefix}addclock <voice channel ID> <Linux-formatted timezone name>\`
			`);
		}
		
		if (!client.guilds.get(arsenal_guild_id).channels.find(ch => ch.id === channel)) return;
		
		if (fs.existsSync(`./cronjobs/updateTime${channel}.js`)){
			fs.unlinkSync(`./cronjobs/updateTime${channel}.js`);
		}
		
		const cronScript = 
`const moment = require('moment');

module.exports = {
	cronstring: '* * * * *',
	execute(client, logger) {
		try { client.guilds.get("${guildID}"); } catch(e) {}
		
		const clocks = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'];
		const halfHourClocks = ['🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'];
		var timeChannel = client.guilds.get("${guildID}").channels.find(ch => ch.id === "${channel}");
		
		var now = moment.tz('${timezone}');
		
		var minute = parseInt(now.format('m'));
		
		var hour = parseInt(now.format('h'));
		
		var clockEmoji = minute < 30 ? clocks[hour - 1] : halfHourClocks[hour - 1];
		
		timeChannel.setName(clockEmoji + " " + now.format('h:mm A zz'));
	}
}`;
		
		fs.appendFileSync(`./cronjobs/updateTime${channel}.js`, cronScript);
		
		cronEvent = require(`../cronjobs/updateTime${channel}.js`);
		client.cronJobs.set(cronName, new cronJob(cronEvent.cronstring, () => cronEvent.execute(client, logger), null, true)); // Start the new one.
		
		message.channel.send(`Clock ${timezone} added!`).then((m) => m.delete(3000));
	}
}