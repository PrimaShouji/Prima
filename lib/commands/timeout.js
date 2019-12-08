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

        let day = (message.content.match(/(?:\s[^\s]+day)|(?:\d+\/\d)+\d+/gi) || [])[0];
		let daysUntil = 0;
		let absDateMod = 0;
        if (day) {
            day = day.trim();

            if (day.indexOf("/") !== -1) {
                const mmddyyyy = day.split("/").map((term) => parseInt(term));

				if (now.getMonth() === mmddyyyy[0] - 1 && now.getFullYear() === yyyy) {
					daysUntil = mmddyyyy[1] - now.getDate();
				} else {
					const yyyy = parseInt(`${mmddyyyy[2] < 100 ? "20" : ""}${mmddyyyy[2]}`);

					let absNextDay = 0;
					for (let i = 0; i < mmddyyyy[0] - 2; i++) {
						absNextDay += daysPerMonth[i];
					}
					absNextDay += mmddyyyy[1];

					let absToday = 0;
					for (let i = 0; i < now.getMonth(); i++) {
						absToday += daysPerMonth[i];
					}
					absToday += now.getDate();

					for (let i = yyyy; i < now.getFullYear(); i++) {
						if (yyyy % 4 === 0 && yyyy % 100 !== 0 || yyyy % 4000 === 0) {
							daysUntil += 366;
						} else {
							daysUntil += 365;
						}
					}

					daysUntil = absNextDay = absToday;
				}
            } else {
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
                }
            }

			absDateMod = daysUntil * 86400000;
        }

        let time = (message.content.match(/\d+:\d+\s?(?:(?:AM)|(?:PM))/gi) || [])[0];
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

		timedOutUntil += absDateMod + absTimeMod;

		const member = await message.guild.fetchMember(user);
		const memberRoles = member.roles.map((role) => role.id);
		await member.removeRoles(memberRoles);
		await member.addRole(message.guild.roles.find((role) => role.name === "Time Out"));

        await collection.insertOne({
            guild: message.guild.id,
            user: user,
			prevRoles: memberRoles,
            timestamp: timedOutUntil,
        });

		await message.author.send(`User ${member.user.tag} timed out from ${message.guild.name} until "${day ? day : ""} ${time ? time : time}"`);
	},
}
