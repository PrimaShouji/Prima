const moment = require("moment");

const getSnowflakeFromMention = require("../util/getSnowflakeFromMention");

const { daysOfWeek, daysPerMonth } = require("../util/common");

module.exports = {
	permissionLevel: "Moderator",
    domain: "moderation",
	execute: async (client, logger, message) => {
        if (!message.guild) return;

		const collection = (await client.db).db(client.dbName).collection("timeouts");

        const user = getSnowflakeFromMention(message.args[0]);
		if (!user) {
			return await message.author.send("Please specify a user to timeout.");
		}

        const now = new Date();
        let timedOutUntil = Date.now();

		const nextTime = moment().seconds(0);

        let day = (message.content.match(/(?:\d+\/\d+\/\d+)|(?:\d+\/\d+)|(?:\s[^\s]+day)/gi) || [])[0];
        if (day) {
			let daysUntil = 0;

            day = day.trim();

            if (day.indexOf("/") !== -1) {
                const mmddyyyy = day.split("/").map((term) => parseInt(term));
				if (mmddyyyy[2]) {
					nextTime.year(mmddyyyy[2]);
				}
				nextTime.month(mmddyyyy[0] - 1).date(mmddyyyy[1]);
            } else {
				day = day.toLowerCase();
				if (day.indexOf('mo') !== -1 || day.indexOf('月') !== -1) day = 'Monday';
	            else if (day.indexOf('tue') !== -1 || day.indexOf('火') !== -1) day = 'Tuesday';
	            else if (day.indexOf('we') !== -1 || day.indexOf('水') !== -1) day = 'Wednesday';
	            else if (day.indexOf('th') !== -1 || day.indexOf('木') !== -1) day = 'Thursday';
	            else if (day.indexOf('fr') !== -1 || day.indexOf('金') !== -1) day = 'Friday';
	            else if (day.indexOf('sa') !== -1 || day.indexOf('土') !== -1) day = 'Saturday';
	            else if (day.indexOf('su') !== -1 || day.indexOf('日') !== -1) day = 'Sunday';
	            else {
	                return await message.author.send("You may have misspelled the day. This command accepts the days of the week written out in full or standardly abbreviated in English or Japanese.");
	            }

                const nextDay = daysOfWeek.indexOf(day);
                if (nextDay > now.getDay()) {
                    daysUntil = nextDay - now.getDay();
                } else if (nextDay < now.getDay()) {
                    daysUntil = 6 - now.getDay() + nextDay;
                } else {
					daysUntil = 7;
				}

				nextTime.day(daysUntil, "days");
            }
        }

        let time = (message.content.match(/\d+:\d+\s?(?:(?:AM)|(?:PM))?/gi) || [])[0];
        if (time) {
            time = time.replace(" ", "").trim().toUpperCase();
            let hours = parseInt(time.slice(0, time.indexOf(":")).match(/\d+/g)[0]);
            let minutes = parseInt(time.slice(time.indexOf(":") + 1).match(/\d+/g)[0]);
            let meridiem;
			let foundMeridiem = time.match(/[^\s\d:]+/g);
			if (foundMeridiem) meridiem = foundMeridiem[0];

            if (meridiem === "PM") {
                hours += 12;
            }

            nextTime.hours(hours).minutes(minutes);
        } else {
			nextTime.hours(0).minutes(0);
		}

        if (!day && !time) {
            return await message.author.send("You need to provide a date and/or time!");
        }

		const member = await message.guild.fetchMember(user);
		const memberRoles = member.roles.map((role) => role.id);
		await member.removeRoles(memberRoles);
		await member.addRole(message.guild.roles.find((role) => role.name === "Time Out"));

        await collection.insertOne({
            guild: message.guild.id,
            user: user,
			prevRoles: memberRoles,
            timestamp: nextTime.valueOf(),
        });

		logger.info(`User ${member.user.tag} timed out from ${message.guild.name} until ${nextTime.valueOf()}`);
		await message.author.send(`User ${member.user.tag} timed out from ${message.guild.name} until ${nextTime.format("dddd, MMMM Do YYYY, h:mm:ss a")}`);
	},
}
