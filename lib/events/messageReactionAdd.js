const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const util = require("util");

const formatDate = require("../util/formatDate");

const { daysOfWeek, times } = require("../util/common");

const { error_channel } = require("../../config.json");

const access = util.promisify(fs.access);
const appendFile = util.promisify(fs.appendFile);
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const scheduleFolderPath = path.join(__dirname, "../../schedules");

module.exports = async (client, logger, reaction, user) => {
	if (user.id === client.user.id) return; // if the reactor is this bot

	const userChannel = reaction.message.guild.members.find(u => u.id === user.id);

	const message = reaction.message;

	// Scheduling reactions:
	if (user.id !== message.author.id && reaction._emoji.name === "📳") {
		const mArgs = message.content.split(/\s+/g).filter((arg) => arg !== "");
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

		for (var i = 0; i < dir.length; i++) {
			const data = await readFile(path.join(scheduleFolderPath, dir[i]));

			if (!data) {
				await message.channel.send(`Error "White Cow" occured while reading a local file <@128581209109430272>.`);
			}

			data = data.toString().split(/,/gm);

			if (data[0] === day && data[1] === time && data[2] === message.author.id) {
				filePath = path.join(scheduleFolderPath, dir[i]);
			}
		}

		// Get the date.
		let dayOfRun = [now.getMonth(), now.getDay(), now.getDate()];
        dayOfRun = formatDate(dayOfRun, runDay);

		try {
			await access(filePath, fs.constants.F_OK);
		} catch (err) {
			await message.channel.send(`Error "Red Cow" occured while writing to a local file <@128581209109430272>.`);
			logger.err(err);
			return;
		}

		try {
			await appendFile(filePath, `${user.id},`);
			logger.info(`${user.tag} has RSVP'd for ${message.author.tag}'s run on ${runDay} at ${runTime}.`);
			userChannel.send(`You have RSVP'd for ${message.member.nickname ? message.member.nickname : message.author.tag}'s run on ${runDay} at ${runTime} (${moment.tz(timezone).format("zz")}) [${dayOfRun[1]}, ${dayOfRun[0]} ${dayOfRun[2]}]! :thumbsup:`);
		} catch (err) {
			await message.channel.send(`Error "White Cow" occured while reading a local file <@128581209109430272>.`);
			logger.err(err);
		}
	}
}

module.exports.domain = "scheduler";
