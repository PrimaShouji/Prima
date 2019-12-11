const commontags = require("common-tags");
const fs = require("fs");
const path = require("path");
const util = require("util");

const { daysOfWeek, times } = require("../util/common");

const { arsenal_guild_id, spreadsheet_id } = require("../../config.json");

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

const scheduleFolderPath = path.join(__dirname, "../../schedules");

module.exports = {
	interval: "*/30 * * * *",
	domain: "scheduler",
	async execute(client, logger) {
		const now = new Date();

		const rsvpList = await readdir(scheduleFolderPath);

		let finalFilePath;
		let fileName;

		while (fileName = rsvpList.pop()) {
			finalFilePath = path.join(scheduleFolderPath, fileName);

			data = (await readFile(finalFilePath)).toString().split(/,+|\r+\n+/gm).filter((el) => el !== "");

			logger.info(fileName);
			let leader;
			leader = client.users.get(data[2]);
			if (!leader) leader = client.guilds.get(arsenal_guild_id).fetchMember(data[2]).catch((e) => leader = e);
			logger.info(leader.tag);

			day = data[0];
			hour = parseInt(data[1].substr(0, data[1].indexOf(':')));
			minute = parseInt(data[1].substr(data[1].indexOf(':') + 1, data[1].indexOf(' ')));
			meridiem = data[1].substr(data[1].indexOf(' ') + 1);
			const runDay = day;
			const runTime = `${hour}:${minute < 10 ? "0" + minute : minute} ${meridiem}`;
			logger.info(`${day},${runTime}`);

			if (hour !== 12 && meridiem.startsWith('PM')) {
				hour += 12;
			}

			if (day === daysOfWeek[now.getDay()]) {
				if (hour === now.getHours() && minute - 30 === now.getMinutes() ||  // Should ping if current time is 12:00PM and listed time is 12:30PM
				hour === now.getHours() + 1 && minute + 30 === now.getMinutes() ||  // Should ping if current time is 13:30PM and listed time is 14:00PM
				hour - 23 === now.getHours() && minute + 30 === now.getMinutes()) { // Should ping if current time is 24:30PM and listed time is 00:00AM
					data = data.slice(3); // Remove metadata

					while (data.length !== 0) {
						id = data.pop();
						try {
							member = client.users.get(id);
							await member.send(`The run you reacted to (hosted by ${leader.tag}) is scheduled to begin in 30 minutes!`);
							logger.info(`Info sent to ${member.tag} about ${leader.tag}'s run.`);
						} catch (e1) {
							logger.error(`${e1}, trying again.`);
							try {
								member = await client.guilds.get(arsenal_guild_id).fetchMember(id);
								member.send(`The run you reacted to (hosted by ${leader.tag}) is beginning in 30 minutes!`);
								logger.info(`Info sent to ${member.tag} about ${leader.tag}'s run.`);
							} catch (e2) {
								try {
									logger.error(`Tried again and failed, messaging in channel: ${e2}`);
									client.guilds.find(g => g.id = arsenal_guild_id).channels.find(ch => ch.name === "scheduling-discussion").send(commontags.stripIndents`
										<@${id}>, the run you reacted to (hosted by ${leader.tag}) is scheduled to begin in 30 minutes! (DM failed, fallback hit.)
									`);
								} catch (e3) {
									logger.error(`Every attempt at notifying user ${id} failed.`);
								}
							}
						}
					}

					await leader.send(`The run you scheduled is set to begin in 30 minutes!`);

					await unlink(finalFilePath);
					logger.info(`File ${fileName} has been removed.`);

					const rows = (await client.sheets.getSpreadsheet(spreadsheet_id, "Backerest Side!B8:H31")).data.values;
					if (rows.length) {
			            // Get the coordinates of the embed message ID.
			            const runCoords = [times.indexOf(runTime), daysOfWeek.indexOf(runDay)]; // [row, col]
			            logger.info(runCoords.toString());
			            const messageID = rows[runCoords[0]][runCoords[1]];
			            if (!messageID) return logger.info("No embed ID.");
			            logger.info(messageID);

			            // Fetch the schedules channel and delete the run embed.
						let guild = client.guilds.get(arsenal_guild_id);
			            let embedChannel = guild ? guild.channels.get("633899725833371658") : null;
			            if (!embedChannel) {
			                embedChannel = client.channels.find((ch) => ch.name === "schedules");
			            }
			            embedChannel
			                .fetchMessage(messageID)
			                    .then(async (m) => {
			                        await m.delete(1800000);
			                        logger.info("Embed deleted successfully.");
			                    });
			        }
				}
			}
		}
	}
}
