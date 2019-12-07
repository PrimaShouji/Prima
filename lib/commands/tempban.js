const getSnowflakeFromMention = require("../util/getSnowflakeFromMention");

const { daysOfWeek } = require("../util/common");

module.exports = {
	permissionLevel: "Moderator",
    domain: "moderation",
	execute: async (client, logger, message) => {
        const dbo = (await client.db).db(client.dbName);

        const user = getSnowflakeFromMention(message.args[0]);

        const now = new Date();

        let day = message.content.match(/(?:\s[^\s]+day)|(?:\d+\/\d)+\d+/gi)[0];
        let daysUntil = 0;
        if (day) {
            day = day.trim();

            if (day.indexOf('mo') !== -1 || day.indexOf('月') !== -1) day = 'Monday';
            else if (day.indexOf('tue') !== -1 || day.indexOf('火') !== -1) day = 'Tuesday';
            else if (day.indexOf('we') !== -1 || day.indexOf('水') !== -1) day = 'Wednesday';
            else if (day.indexOf('th') !== -1 || day.indexOf('木') !== -1) day = 'Thursday';
            else if (day.indexOf('fr') !== -1 || day.indexOf('金') !== -1) day = 'Friday';
            else if (day.indexOf('sa') !== -1 || day.indexOf('土') !== -1) day = 'Saturday';
            else if (day.indexOf('su') !== -1 || day.indexOf('日') !== -1) day = 'Sunday';
            else {
                return await message.author.send("You may have misspelled the day. This command accepts the days of the week written out in full or standardly abbreviated in English or Japanese.`);"
            }

            if (day.indexOf("/") !== -1) {
                const [month, day, year] = day.split("/").map((term) => parseInt(term));

                //
            } else {
                const nextDay = daysOfWeek.indexOf(day);
                if (nextDay > now.getDay()) {
                    //
                } else if (nextDay < now.getDay()) {
                    //
                }
            }
        }

        let time = message.content.match(/\d+:\d+\s?(?:(?:AM)|(?:PM))/gi)[0];
        let absTimeMod = 0;
        if (time) {
            time = time.replace(" ", "").trim().toUpperCase();
            let hours = parseInt(time.slice(0, time.indexOf(":")).match(/\d+/g)[0]);
            let minutes = parseInt(time.slice(time.indexOf(":") + 1).match(/\d+/g)[0]);
            let meridiem = time.match(/[^\s\d:]+/g)[0];

            if (meridiem === "PM") {
                hours += 12;
            }

            absTimeMod = (hours * 3600000) + (minutes * 60000);

            let curTimeMod = 0;
            if (!daysUntil) { // Also catches daysUntil === 0
                curTimeMod = (now.getHours() * 3600000) + (now.getMinutes() * 60000);
                absTimeMod -= curTimeMod;
            }
        }

        if (!day && !time) {
            return await message.author.send("You need to provide a date and/or time!");
        }

        //
	},
}
