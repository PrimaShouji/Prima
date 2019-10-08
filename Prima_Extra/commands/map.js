const Discord = require('discord.js');
const fs = require('fs');
const Prima = require('prima-common.js');

module.exports = {
	name: "map",
	args: true,
	execute(client, message, logger, args) {
		const COST_THRESHOLD = 10;
		const SAFE_LENGTH = 6;
		
		fs.readdir("./assets/xivmaps", (err, files) => {
			if (err) throw err;
			
			files = files.filter((fileName) => fileName.endsWith(".png"));
			
			// Try the easiest case first to save processing time
			var mapName = files.find((fileName) => fileName === args.join(" ").toLowerCase() + ".png");
			
			// The Levenshtein algorithm doesn't work so well on large datasets, so we try to partial match first.
			if (!mapName && args.join(" ").length >= SAFE_LENGTH) {
				mapName = files.find((fileName) => fileName.includes(args.join(" ").toLowerCase()));
			}
			
			// If it doesn't match any file, we do a fuzzy string search to get what the user wanted
			if (!mapName) {
				// Get costs of all files compared to user input
				var nameSteps = new Map();
				for (file of files) {
					Prima.levenshtein(args.join(" ").toLowerCase() + ".png", file, (cost) => {
						nameSteps.set(file, cost);
					});
				}
				
				// Get the cheapest file name
				var cheapest = [undefined, Number.MAX_SAFE_INTEGER];
				nameSteps.forEach((cost, fileName, map) => {
					if (cost < cheapest[1] && cost < COST_THRESHOLD) {
						cheapest[1] = cost;
						cheapest[0] = fileName;
					}
				});
				mapName = cheapest[0];
				
				// There were either no PNG files, or else the user's input was so butchered that nothing passed the cost threshold
				if (!mapName) {
					return message.reply("there's no map with that name!");
				}
			}
			
			message.channel.send(
				new Discord.Attachment(
					"./assets/xivmaps/" + mapName
				)
			);
		});
	}
};