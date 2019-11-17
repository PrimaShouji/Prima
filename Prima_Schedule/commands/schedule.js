const Discord = require('discord.js');
const fs = require('fs');
const readline = require('readline');
const commontags = require('common-tags');
const {google} = require('googleapis'); // For Google Sheets
const { prefix, arsenal_server, arsenal_guild_id, spreadsheet_id } = require('../config.json');

module.exports = {
	name: 'schedule',
	guildOnly: true,
	args: true,
	execute(client, message, logger, args) {
		// Most of the Google Sheets API framework here is copied from the documentation examples :(
		if (message.channel.name !== "scheduling" && message.channel.name !== "scheduling-discussion") return;

		var schedulePublishChannel = message.guild.channels.find((ch) => ch.name === "schedules");
		var dir = fs.readdirSync(`./schedules`);
		var fileName;

		while (fileName === undefined || dir.indexOf(fileName) !== -1) {
			fileName = ''; // Random six-digits
			for (var i = 0; i < 6; i++) {
				fileName += Math.floor(Math.random() * 10);
			}
		}

		// If modifying these scopes, delete token.json.
		const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
		// The file token.json stores the user's access and refresh tokens, and is
		// created automatically when the authorization flow completes for the first
		// time.
		const TOKEN_PATH = './token.json';

		const runTypes = ['FR', 'EX', 'OP', 'OZ', 'RC'];
		const runColors = [
			[159/255, 197/255, 232/255], // I could map this but I don't feel like it...
			[204/255, 102/255, 255/255],
			[255/255, 229/255, 153/255],
			[249/255, 203/255, 156/255],
			[234/255, 153/255, 153/255]
		];

		function getFeb() {
			let year = (new Date()).getFullYear();

			if (year % 100 === 0 && year % 400 !== 0) {
				return 28;
			}

			if (year % 4 === 0) {
				return 29;
			}

			return 28;
		}
		const months = ["Janurary", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		const daysPerMonth = [31, getFeb(), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

		const _dateObj = new Date();
		dayOfRun = [_dateObj.getMonth(), _dateObj.getDay(), _dateObj.getDate()];

		// ez checks
		fs.access(`./schedules/${fileName}`, fs.constants.F_OK, (err) => {
			if (!err) {
				message.channel.send(`Error "Black Cow" occured while accessing a local file <@128581209109430272>.`);
				return; // If it exists then we don't do anything else, shouldn't exist due to the above loop though.
			}

			// Parsing arguments
			args = args.filter((a) => a !== "");

			type = args[0].toUpperCase(); // Run tag
			day = args[1].toLowerCase(); // Day of the week
			time = args[2].toUpperCase(); // Time in the day
			description = ''; // Description is the rest of the arguments, we loop through them

			simple = true;
			for(var i = 3; i < args.length; i++) {
				if (args[i].indexOf('\\n') !== -1) {
					simple = false;
				}
			}
			for(var i = 3; i < args.length; i++) {
				if (!simple || args[i].indexOf('.') === -1) {
					description += args[i] + ' ';
				} else {
					if (simple) {
						description += args[i] + '\n';
					}
				}
			}
			description = description.substr(0, description.length - 1); // Lazy coding to remove the space at the end
			if (!simple) {
				description = description.replace(/\\n/gi, '\n');
			}

			var leader = message.author.tag; // Leader is whoever used the command
			var leaderReadable = message.member.nickname ? message.member.nickname : leader;
			var leaderMention = `<@${message.author.id}>`; // Setting this aside for the announcement later

			var innerText = (' ' + description).slice(1); // force copy

			description = `(${type}) ${description} [${leader}]`; // Reformatting now that all data is organized

			if (innerText.length > 1600) innerText = innerText.substr(0, 1600); // Prevent embed-related crashes

			// Input processing
			if (time === undefined || day === undefined || type === undefined) { // It should short-circuit on the time check, but maybe I'm just being absentminded again :(
				message.reply(`please enter the command with the arguments <type>, <day>, and <time>, e.g. ${prefix}schedule oz sun 1:30PM`);
				return;
			}

			if (runTypes.indexOf(type) === -1) {
				message.reply(`${type} is not a valid run identifier. Valid identifiers include ${runTypes.toString()}`);
			}

			if (isNaN(parseInt(time[0])) // First char isn't a digit
				|| time.indexOf(':') === -1 // Doesn't contain colon
				|| (time.indexOf('A') === -1 && time.indexOf('P') === -1) // Doesn't contain meridiem
				|| time.indexOf('M') === -1 // See above
				|| time.length > 7) // Time has more chars than 12:00PM
				return message.reply(`that's not a valid time! Days and times should be written as \`#:##am/pm\`, with no spaces or formatting.`);

			if (time == '0:00PM') {
				message.reply(`uh... ${time} isn't a time.`);
				return;
			}

			if (parseInt(time.substr(0, time.indexOf(':'))) === 0) { // If the time is formatted "0:30 AM" or "00:00 AM" or something.
				time = `12${time.substr(time.indexOf(':'))}`;
			} else if (parseInt(time[0]) === 0) { // The chart doesn't have zeroes at the start of each entry, so if anyone put zeroes before their time this removes them.
				time = time.slice(1);
			}

			time = `${time.substr(0, time.indexOf('M') - 1)} ${time.substr(time.indexOf('M') - 1)}`; // The chart has the meridiem with a space before it so we just add the space back :v

			minutes = time.substr(time.indexOf(':'));
			minutes = minutes.substr(0, minutes.indexOf(' ')); // I don't know why I have to do it this way but it doesn't work in one line
			if (minutes != ':00') {
				message.reply(`the spreadsheet only has listings every hour. Please use minutes :00.`);
				return;
			}

			if (day.indexOf('mo') !== -1 || day.indexOf('月') !== -1) day = 'Monday';
			else if (day.indexOf('tue') !== -1 || day.indexOf('火') !== -1) day = 'Tuesday';
			else if (day.indexOf('we') !== -1 || day.indexOf('水') !== -1) day = 'Wednesday';
			else if (day.indexOf('th') !== -1 || day.indexOf('木') !== -1) day = 'Thursday';
			else if (day.indexOf('fr') !== -1 || day.indexOf('金') !== -1) day = 'Friday';
			else if (day.indexOf('sa') !== -1 || day.indexOf('土') !== -1) day = 'Saturday';
			else if (day.indexOf('su') !== -1 || day.indexOf('日') !== -1) day = 'Sunday';
			else {
				message.reply(`you may have misspelled the day. This command accepts the days of the week written out in full or standardly abbreviated in English or Japanese.`);
				return;
			}

			// Formatted date
			const dayOfWeekOfRun = daysOfWeek.indexOf(day);
			if (dayOfWeekOfRun > dayOfRun[1]) {
				const diff = dayOfWeekOfRun - dayOfRun[1];
				dayOfRun[2] += diff;
			} else if (dayOfWeekOfRun < dayOfRun[1]) {
				const diff = 7 - dayOfRun[1] + dayOfWeekOfRun;
				dayOfRun[2] += diff;
			}
			if (dayOfRun[2] > daysPerMonth[dayOfRun[0]]) {
				dayOfRun[2] -= daysPerMonth[dayOfRun[0]];
				dayOfRun[0]++;
			}
			if (dayOfRun[0] > 11) {
				dayOfRun[0] -= 12;
			}
			dayOfRun[1] = dayOfWeekOfRun;
			dayOfRun = [months[dayOfRun[0]], daysOfWeek[dayOfRun[1]], dayOfRun[2]];

			// GOOGLE SHEETS API STUFF BELOW

			// Load client secrets from a local file.
			fs.readFile('./credentials.json', (err, content) => {
				if (err) throw err;
				// Authorize a client with credentials, then call the Google Sheets API to edit the document.
				authorize(JSON.parse(content), doSchedule);
			});

			// Auth stuff
			/**
			 * Create an OAuth2 client with the given credentials, and then execute the
			 * given callback function.
			 * @param {Object} credentials The authorization client credentials.
			 * @param {function} callback The callback to call with the authorized client.
			 */
			function authorize(credentials, callback) {
				const {client_secret, client_id, redirect_uris} = credentials.installed;
				const oAuth2Client = new google.auth.OAuth2(
					client_id, client_secret, redirect_uris[0]);

				// Check if we have previously stored a token.
				fs.readFile(TOKEN_PATH, async (err, token) => {
					if (err) return getNewToken(oAuth2Client, callback);
					oAuth2Client.setCredentials(JSON.parse(token));
					await callback(oAuth2Client);
				});
			}

			/**
			 * Get and store new token after prompting for user authorization, and then
			 * execute the given callback with the authorized OAuth2 client.
			 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
			 * @param {getEventsCallback} callback The callback for the authorized client.
			 */
			function getNewToken(oAuth2Client, callback) {
				const authUrl = oAuth2Client.generateAuthUrl({
					access_type: 'offline',
					scope: SCOPES,
				});
				console.log(`Authorize this app by visiting this url: ${authUrl}`);
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl.question('Enter the code from that page here: ', (code) => {
					rl.close();
					oAuth2Client.getToken(code, (err, token) => {
						if (err) return logger.log('error', `Error while trying to retrieve access token ${err}`);
						oAuth2Client.setCredentials(token);
						// Store the token to disk for later program executions
						fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
							if (err) return console.error(err);
							console.log('Token stored to', TOKEN_PATH);
						});
						callback(oAuth2Client);
					});
				});
			}

			async function doSchedule(auth) {
				const sheets = google.sheets({version: 'v4', auth});

				letters = ['B', 'C', 'D', 'E', 'F' ,'G', 'H'];
				days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
				times = ['12:00 AM',
						 '1:00 AM',
						 '2:00 AM',
						 '3:00 AM',
						 '4:00 AM',
						 '5:00 AM',
						 '6:00 AM',
						 '7:00 AM',
						 '8:00 AM',
						 '9:00 AM',
						 '10:00 AM',
						 '11:00 AM',
						 '12:00 PM',
						 '1:00 PM',
						 '2:00 PM',
						 '3:00 PM',
						 '4:00 PM',
						 '5:00 PM',
						 '6:00 PM',
						 '7:00 PM',
						 '8:00 PM',
						 '9:00 PM',
						 '10:00 PM',
						 '11:00 PM'];

				col = letters[days.indexOf(day)];
				row = times.indexOf(time) + 8;
				cell = `${col}${row}`;

				// If the entry already has a run, return to sender
				const runList = fs.readdirSync('./schedules');
				var keepGoing = 0;
				for (file of runList) {
					var otherDay, otherTime;

					fs.readFile(`./schedules/${file}`, async (err, data) => {
						if (err) throw err;

						data = data.toString().split(',');

						otherDay = data[0];
						otherTime = times.indexOf(data[1]);

						checkableTime = times.indexOf(time);

						logger.log('info', `${day}, ${otherDay} - ${checkableTime}, ${otherTime}`);

						if (day == otherDay && Math.abs(checkableTime - otherTime) < 3) {
							message.reply(`there's already a run scheduled at or within 3 hours of this time. To help minimize competition for instances, please schedule your run for a different time.`);
							return;
						} else {
							keepGoing++;
						}

						await next();
					});
				}

				await next();

				async function next() {
					if (keepGoing !== runList.length) return;

					// Otherwise, schedule the run
					fs.writeFile(`./schedules/${fileName}`, `${day},${time},${message.author.id},`, (err) => {
						if (err) {
							message.channel.send(`Error "Red Cow" occured while writing a local file <@128581209109430272>.`);
							throw err;
						}
					});

					logger.log('info', `Run scheduled as "${description}" on ${day} at ${time}`)
					message.channel.send(commontags.stripIndents`
						${leaderMention} has just scheduled a run on ${day} at ${time} (PST)!
						React to the :vibration_mode: on their message to be notified 30 minutes before it begins!
					`)
						.then(() => {
							message.react('📳');
						});

					let color = "#0080ff";
					if (type === "FR") color = "#9fc5e8";
					if (type === "OP") color = "#ffe599";
					if (type === "OZ") color = "#f9cb9c";
					if (type === "RC") color = "#ea9999";
					if (type === "EX") color = "#cc66ff";

					const embeddable = new Discord.RichEmbed()
						.setColor(color)
						.setTitle(`${leaderReadable} has just scheduled a run on ${day} at ${time} (PST) [${dayOfRun[1]}, ${dayOfRun[0]} ${dayOfRun[2]}]!`)
						.setDescription(commontags.stripIndents`
							React to the :vibration_mode: on their message to be notified 30 minutes before it begins!

							**${leaderMention}'s message: <${message.url}>**

							${innerText}

							**Schedule Overview: <https://docs.google.com/spreadsheets/d/${spreadsheet_id}/>**
						`);

					const messageID = (await schedulePublishChannel.send(embeddable)).id;

					// I'm going to be omegalazy and make multiple API calls because I can't figure out how to use batchUpdate with an UpdateCellsRequest
					var range = `Schedule!${cell}`;
					var values = [[description]];
					var resource = {
						values
					};
					sheets.spreadsheets.values.update({
						spreadsheetId: `${spreadsheet_id}`,
						range,
						valueInputOption: `RAW`,
						resource
					}, (err, res) => {
						if (err) return logger.log('error', `The API returned an error: ${err}`);
					});

					range = `Backside!${cell}`;
					values = [[message.url]];
					resource = {
						values
					};
					sheets.spreadsheets.values.update({
						spreadsheetId: `${spreadsheet_id}`,
						range,
						valueInputOption: `RAW`,
						resource
					}, (err, res) => {
						if (err) return logger.log('error', `The API returned an error: ${err}`);
					});

					range = `Backer Side!${cell}`;
					values = [[message.member.nickname || message.author.tag]];
					resource = {
						values
					};
					sheets.spreadsheets.values.update({
						spreadsheetId: `${spreadsheet_id}`,
						range,
						valueInputOption: `RAW`,
						resource
					}, (err, res) => {
						if (err) return logger.log('error', `The API returned an error: ${err}`);
					});

					range = `Backerest Side!${cell}`;
					values = [[messageID]];
					resource = {
						values
					};
					sheets.spreadsheets.values.update({
						spreadsheetId: `${spreadsheet_id}`,
						range,
						valueInputOption: `RAW`,
						resource
					}, (err, res) => {
						if (err) return logger.log('error', `The API returned an error: ${err}`);
					});

					// Here's the second one to format the cell
					startRowIndex = row - 1;
					endRowIndex = startRowIndex + 1;
					startColumnIndex = days.indexOf(day) + 1;
					endColumnIndex = startColumnIndex + 1;
					range = {
						sheetId: 0,
						startRowIndex,
						endRowIndex,
						startColumnIndex,
						endColumnIndex
					};
					const backgroundColor = {
						red: runColors[runTypes.indexOf(type)][0],
						green: runColors[runTypes.indexOf(type)][1],
						blue: runColors[runTypes.indexOf(type)][2],
					};

					requests = [{
						repeatCell: {
							range,
							cell: {
								userEnteredFormat: {
									backgroundColor
								}
							},
							fields: `userEnteredFormat(backgroundColor)`
						}
					}];

					const batchUpdateRequest = {requests};

					sheets.spreadsheets.batchUpdate({
						spreadsheetId: `${spreadsheet_id}`,
						resource: batchUpdateRequest,
						includeSpreadsheetInResponse: false
					}, (err, res) => {
						if (err) return logger.log('error', `The API returned an error: ${err}`);
					});
				}
			}
		});
	}
}
