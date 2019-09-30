// Updates the time every minute.
const moment = require('moment');
const { arsenal_guild_id, time_channel } = require('../config.json');

module.exports = {
	cronstring: '* * * * *',
	execute(client, logger) {
		try { client.guilds.get(arsenal_guild_id); } catch(e) {} // Cache the guild if it isn't cached yet.
		
		const clocks = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'];
		const halfHourClocks = ['🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'];
		var timeChannel = client.guilds.get(arsenal_guild_id).channels.find(ch => ch.id === time_channel);
		
		var now = moment.tz('America/Los_Angeles');
		
		var minute = parseInt(now.format('m'));
		
		var hour = parseInt(now.format('h'));
		
		var clockEmoji = minute < 30 ? clocks[hour - 1] : halfHourClocks[hour - 1];
		
		timeChannel.setName(`${clockEmoji} ${now.format('h:mm A zz')}`);
	}
}