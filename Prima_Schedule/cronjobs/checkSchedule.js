// Check every half hour if there's going to be a run in half an hour
const commontags = require('common-tags');
const fs = require('fs'); // Enables reading command plugin folder
const {google} = require('googleapis'); // For Google Sheets

const { arsenal_guild_id, spreadsheet_id } = require('../config.json');

module.exports = {
	cronstring: '*/30 * * * *',
	execute(client, logger) {
		function clone(a) {
			return JSON.parse(JSON.stringify(a));
		}

		function deleteScheduleEmbed() {
			const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
			const TOKEN_PATH = './token.json';

			fs.readFile('./credentials.json', (err, content) => {
				if (err) throw err;
				// Authorize a client with credentials, then call the Google Sheets API to edit the document.
				authorize(JSON.parse(content), (auth) => {
					const sheets = google.sheets({version: 'v4', auth});

					sheets.spreadsheets.values.get({
						spreadsheetId: spreadsheet_id,
						range: `Backerest Side!B8:H31`,
					}, (err, res) => {
						if (err) return logger.log("error", 'The API returned an error: ' + err);

						const rows = res.data.values;

						const now = new Date();

						if (rows.length) {
							let runCoords; // [row, col]

							let curX = now.getDay();
							let curY = now.getHours() + 1; // Add 1 to round up regardless of minutes.

							let looped = false;

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

								if (rows[curY] && rows[curY][curX] && parseInt(rows[curY][curX])) {
									runCoords = [curY, curX];
									break;
								}

								curY++; // Iterator.
							}

							if (!runCoords) return logger.info("No embed ID.");

							const messageID = res.data.values[runCoords[0]][runCoords[1]];
							logger.info(messageID);

							const guild = client.guilds.get("550702475112480769");
							let embedChannel = guild.channels.get("572084086726983701");
							if (!embedChannel) {
								embedChannel = guild.channels.find((ch) => ch.name === "schedules");
							}
							embedChannel
								.fetchMessage(messageID)
									.then((m) => m.delete(1800000));
						}
					});
				});
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
		}

		now = new Date();
		days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		rsvpList = fs.readdirSync('./schedules');

		while (file = rsvpList.pop()) {
			data = fs.readFileSync(`./schedules/${file}`).toString().split(/,/gm);

			logger.log('info', file);
			var leader;
			leader = client.users.get(data[2]);
			if (leader === undefined) leader = client.guilds.find(g => g.id === arsenal_guild_id).fetchMember(data[2]).catch((e) => leader = e);
			logger.log('info', leader.tag);

			day = data[0];
			hour = parseInt(data[1].substr(0, data[1].indexOf(':')));
			minute = parseInt(data[1].substr(data[1].indexOf(':') + 1, data[1].indexOf(' ')));
			meridiem = data[1].substr(data[1].indexOf(' ') + 1);
			logger.log('info', `${day},${hour}:${minute < 10 ? "0" + minute : minute} ${meridiem}`);

			if (hour !== 12 && meridiem == 'PM') {
				hour += 12;
			}

			if (day === days[now.getDay()]) {
				if (hour === now.getHours() && minute - 30 === now.getMinutes() ||  // Should ping if current time is 12:00PM and listed time is 12:30PM
				hour === now.getHours() + 1 && minute + 30 === now.getMinutes() ||  // Should ping if current time is 13:30PM and listed time is 14:00PM
				hour - 23 === now.getHours() && minute + 30 === now.getMinutes()) { // Should ping if current time is 24:30PM and listed time is 00:00AM
					data.reverse();
					data = data.slice(1); // Remove last comma
					data.reverse();
					data = data.slice(3); // Remove metadata

					while (data.length !== 0) {
						id = data.pop();
						try {
							member = client.users.get(id);
							member.send(`The run you reacted to (hosted by ${leader.tag}) is scheduled to begin in 30 minutes!`);
							logger.log('info', `Info sent to ${member.tag} about ${leader.tag}'s run.`);
						} catch (e1) {
							logger.log('error', `${e1}, trying again.`);
							try {
								member = client.guilds.find(g => g.id = arsenal_guild_id).fetchMember(id);
								member.send(`The run you reacted to (hosted by ${leader.tag}) is beginning in 30 minutes!`);
								logger.log('info', `Info sent to ${member.tag} about ${leader.tag}'s run.`);
							} catch (e2) {
								try {
									logger.log('error', `Tried again and failed, messaging in channel: ${e2}`);
									client.guilds.find(g => g.id = arsenal_guild_id).channels.find(ch => ch.name === "scheduling-discussion").send(commontags.stripIndents`
										<@${id}>, the run you reacted to (hosted by ${leader.tag}) is scheduled to begin in 30 minutes! (DM failed, fallback hit.)
									`);
								} catch (e3) {
									logger.log('error', `Every attempt at notifying user ${id} failed.`);
								}
							}
						}
					}

					var hold = clone(file);
					leader.send(`The run you scheduled is set to begin in 30 minutes!`);
					fs.unlink(`./schedules/${file}`, (err2) => {
						if (err2) throw err2;

						logger.log('info', `File ${hold} has been removed.`);

						deleteScheduleEmbed();
					});
				}
			}
		}
	}
}
