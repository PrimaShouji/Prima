const commontags = require("common-tags");
const { RichEmbed } = require("discord.js");
const fs = require("fs");
const moment = require("moment-timezone");
const path = require("path");
const util = require("util");

const formatDate = require("../util/formatDate");
const getDaysInFeb = require("../util/getDaysInFeb");

const { daysOfWeek, rowLetters, times } = require("../util/common");

const { prefix, spreadsheet_id } = require("../../config.json");

const exists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const runDisplayType = {
    FR: { rgb: [159/255, 197/255, 232/255], hex: "#9fc5e8" },
    EX: { rgb: [204/255, 102/255, 255/255], hex: "#cc66ff" },
    OP: { rgb: [255/255, 229/255, 153/255], hex: "#ffe599" },
    OC: { rgb: [249/255, 203/255, 156/255], hex: "#f9cb9c" },
    RC: { rgb: [234/255, 153/255, 153/255], hex: "#ea9999" },
};

const timezone = "America/Los_Angeles";

const scheduleFolderPath = path.join(__dirname, "../../schedules");

module.exports = {
    domain: "scheduler",
    permissionLevel: "Member",
    execute: async (client, logger, message) => {
        // Validation
        if (!message.channel.name.startsWith("scheduling")) return message.delete();

        const schedulePublishChannel = message.guild.channels.find((channel) => channel.name === "schedules");
        if (!schedulePublishChannel) return;

        // Argument parsing
        if (message.args.length < 3) {
            return message.reply(`please enter the command with the arguments <type>, <day>, and <time>, e.g. ${prefix}schedule oz sun 1:30PM`);
        }

        let runTag = message.args[0].toUpperCase(); // Run tag
        if (!runDisplayType[runTag]) {
            message.reply(`${runTag} is not a valid run identifier. Valid identifiers include ${Object.keys(runDisplayType).toString()}`);
        }

        let runDay = message.args[1].toLowerCase(); // Day of the week
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

        let runTime = message.content.match(/\d+:\d+\s?(?:(?:AM)|(?:PM))/gi)[0]
        let description = message.content.slice(message.content.indexOf(runTime) + runTime.length + 1);
        runTime = runTime.replace(" ", "").trim(); // Time in the day;

        if (runTime === "0:00PM") {
            return message.channel.send(`Um... ${runTime} isn't a time.`);
        } else if (parseInt(runTime.substr(0, runTime.indexOf(':'))) === 0) { // If the time is formatted "0:30 AM" or "00:00 AM" or something.
            runTime = `12${runTime.substr(runTime.indexOf(':'))}`;
        } else if (parseInt(runTime[0]) === 0) { // The chart doesn't have zeroes at the start of each entry, so if anyone put zeroes before their time this removes them.
            runTime = runTime.slice(1);
        }

        runTime = runTime.toUpperCase();
        runTime = `${runTime.substr(0, runTime.indexOf('M') - 1)} ${runTime.substr(runTime.indexOf('M') - 1)}`; // The chart has the meridiem with a space before it so we just add the space back :v
        const minutes = runTime.match(/:\d+/g)[0];
        if (minutes != ":00") {
            return message.reply(`the spreadsheet only has listings every hour. Please use minutes :00.`);
        }

        // Prework stuff
        const leader = message.author.tag; // Leader is whoever used the command
        const leaderReadable = message.member.nickname ? message.member.nickname : leader;
        const leaderMention = `<@${message.author.id}>`; // Setting this aside for the announcement later

        let innerText = (" " + description).slice(1); // force copy
        description = `(${runTag}) ${description} [${leader}]`; // Reformatting now that all data is organized
        if (innerText.length > 1600) innerText = innerText.substr(0, 1600); // Prevent embed-related crashes

        if (!await exists(scheduleFolderPath)) await mkdir(scheduleFolderPath);
        const dir = await readdir(scheduleFolderPath);

        let fileName;
        while (fileName === undefined || dir.indexOf(fileName) !== -1) {
			fileName = ""; // Random six-digits
			for (var i = 0; i < 6; i++) {
				fileName += Math.floor(Math.random() * 10);
			}
		}

        const now = new Date();
		let dayOfRun = [now.getMonth(), now.getDay(), now.getDate()];
        dayOfRun = formatDate(dayOfRun, runDay);

        // Fetch sheet
        const col = rowLetters[daysOfWeek.indexOf(runDay)];
        const row = times.indexOf(runTime) + 8;
        const cell = `${col}${row}`;

        // Ensure no other run is going on around then
        for (const file of dir) {
            let otherDay, otherTime;

            let data = await readFile(`${scheduleFolderPath}/${file}`);
            data = data.toString().split(',');

            otherDay = data[0];
            otherTime = times.indexOf(data[1]);

            checkableTime = times.indexOf(runTime);

            logger.info(`${runDay}, ${otherDay} - ${checkableTime}, ${otherTime}`);

            if (runDay === otherDay && Math.abs(checkableTime - otherTime) < 3) {
                return message.reply(`there's already a run scheduled at or within 3 hours of this time. To help minimize competition for instances, please schedule your run for a different time.`);
            }
        }

        // Write to file
        await writeFile(`./schedules/${fileName}`, `${runDay},${runTime},${message.author.id},`);
        logger.info(`Run scheduled as "${description}" on ${runDay} at ${runTime}`);

        // Create reactable
        message.channel.send(commontags.stripIndents`
            ${leaderMention} has just scheduled a run on ${runDay} at ${runTime} (${moment.tz(timezone).format("zz")})!
            React to the :vibration_mode: on their message to be notified 30 minutes before it begins!
        `)
        .then(() => {
            message.react("📳");
        });

        // Create embed
        const embeddable = new RichEmbed()
            .setColor(runDisplayType[runTag].hex)
            .setTitle(`${leaderReadable} has just scheduled a run on ${runDay} at ${runTime} (${moment.tz(timezone).format("zz")}) [${dayOfRun[1]}, ${dayOfRun[0]} ${dayOfRun[2]}]!`)
            .setDescription(commontags.stripIndents`
                React to the :vibration_mode: on their message to be notified 30 minutes before it begins!

                **${leaderMention}'s message: <${message.url}>**

                ${innerText}

                **Schedule Overview: <https://docs.google.com/spreadsheets/d/${spreadsheet_id}/>**
            `);

        // Actually do sheets stuff
        const sheets = await client.sheets.getAPI();

        const scheduleMessageID = (await schedulePublishChannel.send(embeddable)).id;

        let range = `Schedule!${cell}`;
        let values = [[description]];

        const rangeValues = [
            { range: `Schedule!${cell}`, values: [[description]] },
            { range: `Backside!${cell}`, values: [[message.url]] },
            { range: `Backer Side!${cell}`, values: [[message.member.nickname || message.author.tag]] },
            { range: `Backerest Side!${cell}`, values: [[scheduleMessageID]] },
        ];

        for (const rangeValue of rangeValues) {
            sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheet_id,
                range: rangeValue.range,
                valueInputOption: "RAW",
                resource: {
                    values: rangeValue.values,
                },
            }, (err) => {
                if (err) return logger.error(`The API returned an error: ${err}`);
            });
        }

        // Format the cells
        let startRowIndex = row - 1;
        let endRowIndex = startRowIndex + 1;
        let startColumnIndex = daysOfWeek.indexOf(runDay) + 1;
        let endColumnIndex = startColumnIndex + 1;
        range = {
            sheetId: 0,
            startRowIndex,
            endRowIndex,
            startColumnIndex,
            endColumnIndex,
        };
        const backgroundColor = {
            red: runDisplayType[runTag].rgb[0],
            green: runDisplayType[runTag].rgb[1],
            blue: runDisplayType[runTag].rgb[2],
        };

        let requests = [{
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
    }
};
