const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis'); // For Google Sheets
const { spreadsheet_id } = require('../config.json');

module.exports = {
	name: 'unschedule',
	args: true,
	usage: '<day> <time>',
	guildOnly: true,
	description: `Unschedules a scheduled run that you've scheduled.`,
	execute(client, message, logger, args) {
		if (!args[1]) return message.reply(`this command takes the parameters \`<day>\` and \`<time>\`!`);
		
		const dir = fs.readdirSync(`./schedules`); // It's not like this is an intensive operation, I'll just leave it like this instead of async.
		if (dir.length < 1) return message.reply(`no runs seem to be scheduled right now.`);
		
		var argDay = args[0].toLowerCase();
		var argTime = args[1].toUpperCase();
		
		if (isNaN(parseInt(argTime[0])) // First char isn't a digit
			|| argTime.indexOf(':') === -1 // Doesn't contain colon
			|| (argTime.indexOf('A') === -1 && argTime.indexOf('P') === -1) // Doesn't contain meridiem
			|| argTime.indexOf('M') === -1 // See above
			|| argTime.length > 7) // Time has more chars than 12:00PM
			return message.reply(`that's not a valid time! Times should be written as \`#:##am/pm\`, with no spaces.`);
		
		if (argTime == '0:00PM') {
			message.reply(`uh... ${argTime} isn't a time.`);
			return;
		}
		
		if (parseInt(argTime.substr(0, argTime.indexOf(':'))) === 0) { // If the time is formatted "0:30 AM" or "00:00 AM" or something.
			argTime = `12${argTime.substr(argTime.indexOf(':'))}`;
		} else if (parseInt(argTime[0]) === 0) { // The chart doesn't have zeroes at the start of each entry, so if anyone put zeroes before their time this removes them.
			argTime = argTime.slice(1);
		}
		
		argTime = `${argTime.substr(0, argTime.indexOf('M') - 1)} ${argTime.substr(argTime.indexOf('M') - 1)}`; // The chart has the meridiem with a space before it so we just add the space back :v
		
		if (argDay.indexOf('mo') !== -1 || argDay.indexOf('月') !== -1) argDay = 'Monday';
		else if (argDay.indexOf('tue') !== -1 || argDay.indexOf('火') !== -1) argDay = 'Tuesday';
		else if (argDay.indexOf('we') !== -1 || argDay.indexOf('水') !== -1) argDay = 'Wednesday';
		else if (argDay.indexOf('th') !== -1 || argDay.indexOf('木') !== -1) argDay = 'Thursday';
		else if (argDay.indexOf('fr') !== -1 || argDay.indexOf('金') !== -1) argDay = 'Friday';
		else if (argDay.indexOf('sa') !== -1 || argDay.indexOf('土') !== -1) argDay = 'Saturday';
		else if (argDay.indexOf('su') !== -1 || argDay.indexOf('日') !== -1) argDay = 'Sunday';
		else {
			message.reply(`you may have misspelled the day. This command accepts the days of the week written out in full or standardly abbreviated in English or Japanese.`);
			return;
		}
		
		var foundAny = false; // Flag for if a run at the day and time by the author was found.
		
		for (var i = 0; i < dir.length; i++) {
			if (foundAny) continue;
			
			var data = fs.readFileSync(`./schedules/${dir[i]}`);
			
			if (!data) {
				message.channel.send(`Error "White Cow" occured while reading a local file <@128581209109430272>.`);
				return;
			}
			
			data = data.toString().split(/,/gm);
			
			if (data[0] === argDay && data[1] === argTime && data[2] === message.author.id) {
				foundAny = true;
				next(dir[i]);
			}
		}
		
		if (!foundAny) return message.reply(`you don't seem to have a run scheduled at that day and time!`);
		
		function next(fileName) {
			fs.readFile(`./schedules/${fileName}`, (err, data) => {
				if (err) logger.log('error', err) // If it doesn't exist then we don't do anything else.
				
				var data = data.toString().split(/,/gm);
				schedulePublishChannel = message.guild.channels.find((ch) => ch.name === "schedules");
				
				const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
				const TOKEN_PATH = './token.json';
				
				// Cell colors
				const rowColors = [
					[204/255, 204/255, 204/255],
					[1.0, 1.0, 1.0]
				];
				
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
					fs.readFile(TOKEN_PATH, (err, token) => {
						if (err) return getNewToken(oAuth2Client, callback);
						oAuth2Client.setCredentials(JSON.parse(token));
						callback(oAuth2Client);
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
				
				function doSchedule(auth) {
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
							 
					day = data[0];
					time = data[1];
					
					col = letters[days.indexOf(day)];
					row = times.indexOf(time) + 8;
					cell = `${col}${row}`;
					
					// I'm going to be omegalazy and make two API calls because I can't figure out how to use batchUpdate with an UpdateCellsRequest
					range = `Schedule!${cell}`;
					values = [['']];
					const resource = {
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
					
					// Determining color
					colorID = 1;
					if (row % 2 === 0) { // even col, even row
						colorID = 0;
					}
					const backgroundColor = {
						red: rowColors[colorID][0],
						green: rowColors[colorID][1],
						blue: rowColors[colorID][2],
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
					
					// Actually delete the relevant file.
					fs.unlink(`./schedules/${fileName}`, (err) => {
						if (err) throw err;
						
						logger.log('info', `File ${fileName} has been removed, ${message.author.tag} has unscheduled their run.`);
						message.reply(`your run has been unscheduled.`);
						schedulePublishChannel.send(`<@${message.author.id}> has unscheduled their run.`);
					});
				}
			});
		}
	}
}