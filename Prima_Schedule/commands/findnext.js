const {google} = require('googleapis');
const Discord = require('discord.js');
const fs = require('fs');
const readline = require('readline');
const commontags = require('common-tags');

const {
	spreadsheet_id
} = require('../config.json');


module.exports = {
	name: 'findnext',
	description: 'Get the next scheduled run of a given type.',
	usage: '<ID>',
	args: true,
	execute(client, message, logger, args) {
		const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
		const TOKEN_PATH = './token.json';

		const now = new Date();

		const iden = ["FR", "OP", "OZ", "RC", "EX"];
		const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

		if (!iden.find(code => code === args[0].toUpperCase())) return message.reply(`that's not a valid identifier!`);

		fs.readFile('./credentials.json', (err, content) => {
			if (err) throw err;
			// Authorize a client with credentials, then call the Google Sheets API to edit the document.
			authorize(JSON.parse(content), checkSchedule);
		});

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

		function checkSchedule(auth) {
			const sheets = google.sheets({version: 'v4', auth});

			sheets.spreadsheets.values.get({
				spreadsheetId: spreadsheet_id,
				range: `Schedule!B8:H31`,
			}, (err, res) => {
				if (err) return logger.log("error", 'The API returned an error: ' + err);

				const rows = res.data.values;

				if (rows.length) {
					var runCoords; // [row, col]

					var curX = now.getDay();
					var curY = now.getHours() + 1; // Add 1 to round up regardless of minutes.

					var looped = false;

					while (!runCoords) {
						if (curY >= 24) { // If the y-index overflows, loop it and shift the x-index over one.
							curY -= 24;
							curX += 1;
						}

						if (curX > 6) {
							curX -= 7; // If the x-index overflows, loop back to Sunday.
							looped = true;
						}

						if (looped && curX === now.getDay()) break; // There are no matches.

						if (rows[curY] && rows[curY][curX] && rows[curY][curX].startsWith("(" + args[0].toUpperCase() + ")")) {
							runCoords = [curY, curX];
							break;
						}

						curY++; // Iterator.
					}

					if (!runCoords) return message.reply(`no runs were found matching that identifier.`);

					var time = runCoords[0];
					const day = days[runCoords[1]];
					var meridiem = "AM";

					if (time === 0) {
						time = 12;
					}

					if (time >= 12) {
						if (time > 12) {
							time -= 12;
						}
						meridiem = "PM";
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
					logger.log('info', runCoords[1]);
					logger.log('info', now.getDay());
					if (runCoords[1] < now.getDay()) { // Next run is to the left.
						nextDayOfTheMonth += (7 - now.getDay()) + runCoords[1];
					} else if (runCoords[1] > now.getDay()) { // Next run is to the right.
						nextDayOfTheMonth += runCoords[1] - now.getDay();
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

					sheets.spreadsheets.values.get({
						spreadsheetId: spreadsheet_id,
						range: `Backside!B8:H31`,
					}, (err, res) => {
						var messageLink = res.data.values[runCoords[0]][runCoords[1]];

						sheets.spreadsheets.values.get({
							spreadsheetId: spreadsheet_id,
							range: `Backer Side!B8:H31`,
						}, (err, res) => {
							var nickname = res.data.values[runCoords[0]][runCoords[1]];

							message.reply(commontags.stripIndents`
								run found at ${time}:00 ${meridiem} on ${day}, ${thisMonthStr} ${nextDayOfTheMonth}, hosted by ${nickname} :thumbsup:

								**Message Link: <${messageLink}>**
								**Full Schedule: <https://docs.google.com/spreadsheets/d/${spreadsheet_id}/>**
							`);
						});
					});
				} else {
					logger.log("error", "No data found.");
					message.reply(`there seems to be no data in the table. Please contact an administrator if this is in error.`);
				}
			});
		}
	},
};
