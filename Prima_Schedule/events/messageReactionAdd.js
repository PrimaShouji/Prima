const Discord = require('discord.js');
const fs = require('fs');
const commontags = require('common-tags');

const {
	prefix,
	arsenal_guild_id,
	error_channel
} = require('../config.json');

module.exports = async (client, logger, reaction, user) => {
	function getFeb() {
		let year = new Date().getFullYear();

		if (year % 100 === 0 && year % 400 !== 0) {
			return 28;
		}

		if (year % 4 === 0) {
			return 29;
		}

		return 28;
	}

	if (user.id === client.user.id) return; // if the reactor is this bot

	userChannel = reaction.message.guild.members.find(u => u.id === user.id);

	// Scheduling reactions:
	if (user.id !== reaction.message.author.id && reaction._emoji.name === '📳') {
		var content = reaction.message.content.split(/\s/g); // Day is index 2, time is index 3.
		var day = content[2].toLowerCase();
		var time = content[3].toUpperCase();

		const now = new Date();
		const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

		// Get the date.
		var dateRef = new Discord.Collection();
		dateRef.set("Jan", { id: 0, name: "January", days: 31 });
		dateRef.set("Feb", { id: 1, name: "Feburary", days: getFeb() });
		dateRef.set("Mar", { id: 2, name: "March", days: 31 });
		dateRef.set("Apr", { id: 3, name: "April", days: 30 });
		dateRef.set("May", { id: 4, name: "May", days: 31 });
		dateRef.set("Jun", { id: 5, name: "June", days: 30 });
		dateRef.set("Jul", { id: 6, name: "July", days: 31 });
		dateRef.set("Aug", { id: 7, name: "August", days: 31 });
		dateRef.set("Sep", { id: 8, name: "September", days: 30 });
		dateRef.set("Oct", { id: 9, name: "October", days: 31 });
		dateRef.set("Nov", { id: 10, name: "November", days: 30 });
		dateRef.set("Dec", { id: 11, name: "Descember", days: 31 });

		var nextTime = new Date();
		var nextDayOfTheMonth = now.getDate();
		logger.log('info', days.indexOf(day));
		logger.log('info', now.getDay());
		if (days.indexOf(day) < now.getDay()) { // Next run is to the left.
			nextDayOfTheMonth += (7 - now.getDay()) + runCoords[1];
		} else if (days.indexOf(day) > now.getDay()) { // Next run is to the right.
			nextDayOfTheMonth += days.indexOf(day) - now.getDay();
		}

		var thisMonthStr = "Jan";
		dateRef.forEach((value, key, map) => {
			if (now.toString().includes(key)) {
				thisMonthStr = dateRef.get(key).name;
				if (nextDayOfTheMonth > dateRef.get(key).days) {
					nextDayOfTheMonth -= dateRef.get(key).days;
					thisMonthStr = dateRef.find((month) => {
						if (month.id === dateRef.get(key).id + 1) {
							return true;
						} else if (month.id - 11 === 0) {
							return true;
						}
					}).name;
				}
			}
		});

		fs.access(`./schedules/${fileName}`, fs.constants.F_OK, (err1) => {
			if (err1) return; // File does not exist.

			fs.appendFile(`./schedules/${fileName}`, `${user.id},`, (err2) => {
				if (err2) throw err2;

				logger.log('info', `${user.tag} has RSVP'd for ${reaction.message.author.tag}'s run on ${day} at ${time}.`);
				userChannel.send(`You have RSVP'd for ${reaction.message.member.nickname ? reaction.message.member.nickname : reaction.message.author.tag}'s run on ${day}, ${thisMonthStr} ${nextDayOfTheMonth} at ${time}! :thumbsup:`);
			});
		});
	}
}
