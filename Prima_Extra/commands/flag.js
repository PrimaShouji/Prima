const Discord = require('discord.js');
const fs = require('fs');
const gm = require('gm');
const Prima = require('prima-common.js');

module.exports = {
	name: "flag",
	args: true,
	execute(client, message, logger, args) {
		//
		// Basic definitions
		//
		
		function getSquashedCoords(zoneName) {
			if (zoneName === "coerthas western highlands.png" ||
				zoneName === "the dravanian forelands.png" ||
				zoneName === "the dravanian hinterlands.png" ||
				zoneName === "the churning mists.png" ||
				zoneName === "azys lla.png" ||
				zoneName === "the sea of clouds.png") {
				return { x: 44, y: 44 }; // HW maps are slightly larger.
			}
			if (zoneName === "goblet.png" ||
				zoneName === "goblet subdivision.png" ||
				zoneName === "ul'dah.png" ||
				zoneName === "lavender beds.png" ||
				zoneName === "lavender beds subdivision.png" ||
				zoneName === "gridania.png" ||
				zoneName === "mist.png" ||
				zoneName === "mist subdivision.png" ||
				zoneName === "limsa lominsa.png" ||
				zoneName === "ishgard foundation.png" ||
				zoneName === "ishgard the pillars.png" ||
				zoneName === "shirogane.png" ||
				zoneName === "shirogane subdivision.png" ||
				zoneName === "kugane.png" ||
				zoneName === "rhalgr's reach.png") {
				return { x: 21, y: 21 }; // Usual size of non-combat areas.
			}
			if (zoneName === "doman enclave.png" ||
				zoneName === "idyllshire.png" ||
				zoneName === "the gold saucer.png" ||
				zoneName === "chocobo square.png") {
				return { x: 11, y: 11 };
			}
			if (zoneName === "wolves den pier.png") {
				return { x: 8.7, y: 8.7 };
			}
			return { x: 42, y: 42 }; // Usual squashed coordinate size of world maps.
		};
		
		function getRealCoords(zoneName) {
			return { x: 585, y: 585 }; // Usual size of world maps.
		};
		
		const COST_THRESHOLD = 10;
		const SAFE_LENGTH = 6;
		
		//
		// Basic input processing
		//
		
		var xHolder = args.shift().match(/\d+/g);
		var yHolder = args.shift().match(/\d+/g);
		
		if (!xHolder || !yHolder) {
			return message.reply("please enter that command in the format `~flag <x-coordinate> <y-coordinate> <map name>`.");
		}
		
		const X_COORD = parseFloat(xHolder[0] + "." + (xHolder[1] ? xHolder[1] : ""));
		const Y_COORD = parseFloat(yHolder[0] + "." + (yHolder[1] ? yHolder[1] : ""));
		
		if (isNaN(X_COORD) || isNaN(Y_COORD)) {
			return message.reply("please enter that command in the format `~flag <x-coordinate> <y-coordinate> <map name>`.");
		}
		
		//
		// Main logic
		//
		
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
			
			// Place flag and send image
			var fileCoords = getRealCoords(mapName);
			var gameCoords = getSquashedCoords(mapName);
			
			gm(fs.readFileSync("./assets/xivmaps/" + mapName), mapName)
			.draw("image", "Over", ((X_COORD * fileCoords.x) / gameCoords.x) - 16, ((Y_COORD * fileCoords.y) / gameCoords.y) - 16, 32, 32, "/home/prima/Prima/Prima_Extra/assets/icons/redflag.png")
			.write("/home/prima/Prima/Prima_Extra/temp/" + message.channel.id + mapName, (err) => {
				if (err) throw err;
				
				message.channel.send(
					new Discord.Attachment(
						"./temp/" + message.channel.id + mapName
					)
				).then((m) => {
					fs.unlink("./temp/" + message.channel.id + mapName, (err) => {
						if (err) throw err;
					});
				});
			});
		});
	}
};
