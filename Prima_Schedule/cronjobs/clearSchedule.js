// Every day at 0:00 AM, clear the previous day's runs in the Google Sheet.
const Discord = require('discord.js');
const {google} = require('googleapis'); // For Google Sheets
const fs = require('fs'); // Enables reading command plugin folder
const readline = require('readline');
const commontags = require('common-tags'); // Text formatting

const {
	spreadsheet_id
} = require('../config.json');

module.exports = {
	cronstring: '0 0 * * *',
	execute(client, logger) {
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

		const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
		const TOKEN_PATH = './token.json';

		const rowColors = [
			[204/255, 204/255, 204/255],
			[1.0, 1.0, 1.0]
		];

		const dayLetters = ['B', 'C', 'D', 'E', 'F' ,'G', 'H'];
		const dayList = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

		const now = new Date();

		fs.readFile('./credentials.json', (err, content) => {
			if (err) throw err;
			// Authorize a client with credentials, then call the Google Sheets API to edit the document.
			authorize(JSON.parse(content), emptySchedule);
		});

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

		function emptySchedule(auth) {
			const sheets = google.sheets({version: 'v4', auth});

			dayID = now.getDay();
			if (dayID === 0) {
				dayID = 7
			}
			col = dayID - 1;

			// First we clear the data
			range = `Schedule!${dayLetters[col]}7:${dayLetters[col]}`
			values = [];
			for (var i = 0; i < 25; i++) {
				values[i] = [];
				values[i].push("");
			}

			// Then we set the date.
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
			dateRef.set("Dec", { id: 11, name: "December", days: 31 });

			var nextTime = new Date();
			var nextDayOfTheMonth = now.getDate() + 7;

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

			values[0][0] = `${dayList[col]}, ${thisMonthStr} ${nextDayOfTheMonth}`

			// Send the update
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

			// Finally we reformat the cells
			startColumnIndex = col + 1;
			endColumnIndex = startColumnIndex + 1;

			requests = [];
			for (var i = 9; i < 31; i++) {
				startRowIndex = i;
				endRowIndex = i + 1;
				range = {
					sheetId: 0,
					startRowIndex,
					endRowIndex,
					startColumnIndex,
					endColumnIndex
				};

				// Determining color
				colorID = 0;
				if (i % 2 === 0) { // even i, odd number row
					colorID = 1;
				}

				const backgroundColor = {
					red: rowColors[colorID][0],
					green: rowColors[colorID][1],
					blue: rowColors[colorID][2],
				};

				requests.push({
					repeatCell: {
						range,
						cell: {
							userEnteredFormat: {
								backgroundColor
							}
						},
						fields: `userEnteredFormat(backgroundColor)`
					}
				});
			}

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
}
