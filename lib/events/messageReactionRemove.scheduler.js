const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const util = require("util");

const { daysOfWeek, times } = require("../util/common");

const { prefix, error_channel } = require("../../config.json");

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const scheduleFolderPath = path.join(__dirname, "../../schedules");

const scheduleCustomEmojis = ["666512117943238696"];

module.exports = async (client, logger, reaction, user) => {
	if (user.id === client.user.id) return; // if the reactor is this bot

	const userChannel = reaction.message.guild.members.find(u => u.id === user.id);

	const message = reaction.message;

	// Scheduling reactions:
	if (user.id !== message.author.id && (reaction._emoji.name === "📳" || scheduleCustomEmojis.includes(reaction._emoji.id))) {
		const mArgs = message.content.split(/\s+/g).filter((arg) => arg !== "");
		if (mArgs[0] === prefix) {
			mArgs[1] = mArgs.shift() + mArgs[1];
		}
		mArgs.shift();
		let runDay = mArgs[1].toLowerCase(); // Day of the week
		let runTime = message.content.match(/\d+:\d+\s?(?:(?:AM)|(?:PM))/gi)[0].replace(" ", "").trim(); // Time in the day;

		const now = new Date();

		if (parseInt(runTime.substr(0, runTime.indexOf(':'))) === 0) { // If the time is formatted "0:30 AM" or "00:00 AM" or something.
            runTime = `12${runTime.substr(runTime.indexOf(':'))}`;
        } else if (parseInt(runTime[0]) === 0) { // The chart doesn't have zeroes at the start of each entry, so if anyone put zeroes before their time this removes them.
            runTime = runTime.slice(1);
        }

		runTime = runTime.toUpperCase();
        runTime = `${runTime.substr(0, runTime.indexOf('M') - 1)} ${runTime.substr(runTime.indexOf('M') - 1)}`; // The chart has the meridiem with a space before it so we just add the space back :v

		if (runDay.indexOf('mo') !== -1 || runDay.indexOf('月') !== -1) runDay = 'Monday';
        else if (runDay.indexOf('tue') !== -1 || runDay.indexOf('火') !== -1) runDay = 'Tuesday';
        else if (runDay.indexOf('we') !== -1 || runDay.indexOf('水') !== -1) runDay = 'Wednesday';
        else if (runDay.indexOf('th') !== -1 || runDay.indexOf('木') !== -1) runDay = 'Thursday';
        else if (runDay.indexOf('fr') !== -1 || runDay.indexOf('金') !== -1) runDay = 'Friday';
        else if (runDay.indexOf('sa') !== -1 || runDay.indexOf('土') !== -1) runDay = 'Saturday';
        else if (runDay.indexOf('su') !== -1 || runDay.indexOf('日') !== -1) runDay = 'Sunday';

		const dir = await readdir(scheduleFolderPath);
		let filePath;
		let data;

		for (var i = 0; i < dir.length; i++) {
			data = await readFile(path.join(scheduleFolderPath, dir[i]));

			if (!data) {
				await message.channel.send(`Error "White Cow" occured while reading a local file <@128581209109430272>.`);
			}

			data = data.toString().split(/,+|\r+\n+/gm).filter((el) => el !== "");

			if (data[0] === runDay && data[1] === runTime && data[2] === message.author.id) {
				filePath = path.join(scheduleFolderPath, dir[i]);
			}
		}

		if(filePath && data.indexOf(user.id) !== -1){
			data.splice(data.indexOf(user.id), 1);

			try {
				await writeFile(filePath, `${data.join()},`);
			} catch (err) {
				await message.channel.send(`Error "Blue Cow" occured while reading a local file <@128581209109430272>.`);
				logger.error(err);
				return;
			}

			logger.info(`${user.tag} has un-RSVP'd for ${message.author.tag}'s run on ${runDay} at ${runTime}.`);
			userChannel.send(`You have un-RSVP'd for ${message.member.nickname ? message.member.nickname : message.author.tag}'s run.`);
		}
	}
}

module.exports.domain = "scheduler";
