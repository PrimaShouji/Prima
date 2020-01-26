const Discord = require("discord.js");

const { daysOfWeek, rowLetters } = require("../util/common");
const getDaysInFeb = require("../util/getDaysInFeb");

const { spreadsheet_id } = require("../../config.json");

const rowColors = [
	[204/255, 204/255, 204/255],
	[1.0, 1.0, 1.0]
];

module.exports = {
	interval: "0 0 * * *",
	domain: "scheduler",
	async execute(client, logger) {
		const now = new Date();

		const sheets = await client.sheets.getAPI();

		let col = now.getDay() - 1;
		if (col === -1) col = 6;

		// First we clear the data
		let range = `Schedule!${rowLetters[col]}7:${rowLetters[col]}`
		const values = [];
		for (var i = 0; i < 25; i++) {
			values[i] = [""];
		}

		// Then we set the date.
		var dateRef = new Discord.Collection();
		dateRef.set("Jan", { id: 0, name: "January", days: 31 });
		dateRef.set("Feb", { id: 1, name: "Feburary", days: getDaysInFeb() });
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

		let nextTime = new Date();
		let nextDayOfTheMonth = now.getDate() + 6;

		let thisMonthStr = "Jan";
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

		values[0][0] = `${daysOfWeek[col]}, ${thisMonthStr} ${nextDayOfTheMonth}`

		// Send the update
		const resource = {
			values
		};

		sheets.spreadsheets.values.update({
			spreadsheetId: spreadsheet_id,
			range,
			valueInputOption: "RAW",
			resource
		}, (err) => {
			if (err) return logger.error(`The API returned an error: ${err}`);
		});

		// Finally we reformat the cells
		const startColumnIndex = col + 1;
		const endColumnIndex = startColumnIndex + 1;

		requests = [];
		for (var i = 9; i < 31; i++) {
			startRowIndex = i;
			endRowIndex = i + 1;
			range = {
				sheetId: 0,
				startRowIndex,
				endRowIndex,
				startColumnIndex,
				endColumnIndex,
			};

			// Determining color
			let colorID = 0;
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
							backgroundColor,
						},
					},
					fields: `userEnteredFormat(backgroundColor)`,
				}
			});
		}

		const batchUpdateRequest = {requests};

		sheets.spreadsheets.batchUpdate({
			spreadsheetId: spreadsheet_id,
			resource: batchUpdateRequest,
			includeSpreadsheetInResponse: false,
		}, (err) => {
			if (err) return logger.info(`The API returned an error: ${err}`);
		});

	}
}
