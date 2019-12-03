const fs = require("fs");
const path = require("path");
const util = require("util");

const { daysOfWeek, rowLetters, times } = require("../util/common");

const { spreadsheet_id } = require("../../config.json");

const exists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

const rowColors = [
    [204/255, 204/255, 204/255],
    [1.0, 1.0, 1.0]
];

const scheduleFolderPath = path.join(__dirname, "../../schedules");

module.exports = {
    domain: "scheduler",
    execute: async (client, logger, message) => {
        if (!await exists(scheduleFolderPath)) await mkdir(scheduleFolderPath);
        const dir = await readdir(scheduleFolderPath);
		if (dir.length < 1) return message.reply(`no runs seem to be scheduled right now.`);

        const schedulePublishChannel = message.guild.channels.find((ch) => ch.name === "schedules");

        // Day processing
        let runDay = message.args[0].toLowerCase();
        if (runDay.indexOf('mo') !== -1 || runDay.indexOf('月') !== -1) runDay = 'Monday';
        else if (runDay.indexOf('tue') !== -1 || runDay.indexOf('火') !== -1) runDay = 'Tuesday';
        else if (runDay.indexOf('we') !== -1 || runDay.indexOf('水') !== -1) runDay = 'Wednesday';
        else if (runDay.indexOf('th') !== -1 || runDay.indexOf('木') !== -1) runDay = 'Thursday';
        else if (runDay.indexOf('fr') !== -1 || runDay.indexOf('金') !== -1) runDay = 'Friday';
        else if (runDay.indexOf('sa') !== -1 || runDay.indexOf('土') !== -1) runDay = 'Saturday';
        else if (runDay.indexOf('su') !== -1 || runDay.indexOf('日') !== -1) runDay = 'Sunday';
        else {
            return message.reply(`you may have misspelled the day. This command accepts the days of the week written out in full or standardly abbreviated in English or Japanese.`);
        }

        // Time processing
        let runTime = message.content.match(/\d+:\d+\s?(?:(?:AM)|(?:PM))/gi)[0].replace(" ", "").toUpperCase();
        if (runTime === "0:00PM") {
            return message.channel.send(`Um... ${runTime} isn't a time.`);
        } else if (parseInt(runTime.substr(0, runTime.indexOf(':'))) === 0) { // If the time is formatted "0:30 AM" or "00:00 AM" or something.
            runTime = `12${runTime.substr(runTime.indexOf(':'))}`;
        } else if (parseInt(runTime[0]) === 0) { // The chart doesn't have zeroes at the start of each entry, so if anyone put zeroes before their time this removes them.
            runTime = runTime.slice(1);
        }

        runTime = `${runTime.substr(0, runTime.indexOf('M') - 1)} ${runTime.substr(runTime.indexOf('M') - 1)}`; // The chart has the meridiem with a space before it so we just add the space back :v

        // Directory search
        let found;
        for (let i = 0; i < dir.length; i++) {
			if (found) continue;

			let data = await readFile(`${scheduleFolderPath}/${dir[i]}`);

			if (!data) {
				message.channel.send(`Error "Black Cow" occured while reading a local file <@128581209109430272>.`);
				return;
			}

			data = data.toString().split(/,/g);

			if (data[0] === runDay && data[1] === runTime && data[2] === message.author.id) {
				found = dir[i];
			}
		}

        if (!found) return message.reply(`you don't seem to have a run scheduled at that day and time!`);

        const data = (await readFile(`${scheduleFolderPath}/${found}`)).toString().split(/,/gm);

        // Remove from sheet
        const sheets = await client.sheets.getAPI();

        const day = data[0];
        const time = data[1];

        const col = rowLetters[daysOfWeek.indexOf(runDay)];
        const row = times.indexOf(runTime) + 8;
        const cell = `${col}${row}`;

        let range = `Schedule!${cell}`;
        let values = [[""]];
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

        const startRowIndex = row - 1;
        const endRowIndex = startRowIndex + 1;
        const startColumnIndex = daysOfWeek.indexOf(day) + 1;
        const endColumnIndex = startColumnIndex + 1;
        range = {
            sheetId: 0,
            startRowIndex,
            endRowIndex,
            startColumnIndex,
            endColumnIndex
        };

        // Determining color
        let colorID = 1;
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
                        backgroundColor,
                    },
                },
                fields: "userEnteredFormat(backgroundColor)",
            },
        }];

        const batchUpdateRequest = {requests};

        sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheet_id,
            resource: batchUpdateRequest,
            includeSpreadsheetInResponse: false,
        }, (err) => {
            if (err) return logger.error(`The API returned an error: ${err}`);
        });

        // Actually delete the relevant file.
        let fileName = found;

        await unlink(`${scheduleFolderPath}/${fileName}`)

        logger.info(`File ${fileName} has been removed, ${message.author.tag} has unscheduled their run.`);
        message.reply(`your run has been unscheduled.`);
        schedulePublishChannel.send(`<@${message.author.id}> has unscheduled their run.`).then((m) => m.delete(10000));

        logger.info("Deleting embed...");

        const sheetData = await client.sheets.getSpreadsheet(spreadsheet_id, "Backerest Side!B8:H31");
        if (!sheetData) return logger.error('The API returned an error: ' + err);

        const rows = sheetData.data.values;

        const now = new Date();

        if (rows.length) {
            // Get the coordinates of the embed message ID.
            const runCoords = [times.indexOf(runTime), daysOfWeek.indexOf(runDay)]; // [row, col]
            logger.info(runCoords.toString());
            const messageID = rows[runCoords[0]][runCoords[1]];
            if (!messageID) return logger.info("No embed ID.");
            logger.info(messageID);

            // Fetch the schedules channel and delete the run embed.
            let embedChannel = message.guild.channels.get("633899725833371658");
            if (!embedChannel) {
                embedChannel = message.guild.channels.find((ch) => ch.name === "schedules");
            }
            embedChannel
                .fetchMessage(messageID)
                    .then(async (m) => {
                        await m.delete();
                        logger.info("Embed deleted successfully.");
                    });
        }
    }
};
