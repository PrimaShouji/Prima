const fs = require('fs');

module.exports = async (client, logger, reaction, user) => {
	if (user.id === client.user.id) return;
	
	userChannel = reaction.message.guild.members.find(u => u.id === user.id);
	
	// Scheduling reactions:
	if (user.id !== reaction.message.author.id && reaction._emoji.name === '📳') {
		var content = reaction.message.content.split(/\s/g); // Day is index 2, time is index 3.
		var day = content[2].toLowerCase();
		var time = content[3].toUpperCase();
		
		if (parseInt(time.substr(0, time.indexOf(':'))) === 0) { // If the time is formatted "0:30 AM" or "00:00 AM" or something.
			time = `12${time.substr(time.indexOf(':'))}`;
		} else if (parseInt(time[0]) === 0) { // The chart doesn't have zeroes at the start of each entry, so if anyone put zeroes before their time this removes them.
			time = time.slice(1);
		}
		
		time = `${time.substr(0, time.indexOf('M') - 1)} ${time.substr(time.indexOf('M') - 1)}`; // The chart has the meridiem with a space before it so we just add the space back :v
		
		if (day == 'monday' || day == 'mon' || day == '月') day = 'Monday';
		else if (day == 'tuesday' || day == 'tues' || day == '火') day = 'Tuesday';
		else if (day == 'wednesday' || day == 'wed' || day == 'weds' || day == '水') day = 'Wednesday';
		else if (day == 'thursday' || day == 'thurs' || day == '木') day = 'Thursday';
		else if (day == 'friday' || day == 'fri' || day == '金') day = 'Friday';
		else if (day == 'saturday' || day == 'sat' || day == '土') day = 'Saturday';
		else if (day == 'sunday' || day == 'sun' || day == '日') day = 'Sunday';
		
		const dir = fs.readdirSync(`./schedules`);
		var fileName;
		
		for (var i = 0; i < dir.length; i++) {
			var data = fs.readFileSync(`./schedules/${dir[i]}`);
			
			if (!data) {
				reaction.message.channel.send(`Error "White Cow" occured while reading a local file <@128581209109430272>.`);
			}
			
			data = data.toString().split(/,/gm);
			
			if (data[0] === day && data[1] === time && data[2] === reaction.message.author.id) {
				fileName = dir[i];
			}
		}
		
		fs.readFile(`./schedules/${fileName}`, (err1, data) => {
			if (err1) return; // Author doesn't have a run scheduled.
			
			data = data.toString().split(',');
			data.pop();
			
			if(data.indexOf(user.id) !== -1){
				data.splice(data.indexOf(user.id), 1);
				
				fs.writeFile(`./schedules/${fileName}`, `${data.join()},`, (err2) => {
					if (err2) throw err2;
					
					logger.log('info', `${user.tag} has un-RSVP'd for ${reaction.message.author.tag}'s run on ${day} at ${time}..`);
					userChannel.send(`You have un-RSVP'd for ${reaction.message.member.nickname ? reaction.message.member.nickname : reaction.message.author.tag}'s run.`);
				});
			}
		});
	}
}