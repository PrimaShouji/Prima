const commontags = require('common-tags');
const Discord = require('discord.js');
const request = require('request-promise');
const Teamcraft = require('@ffxiv-teamcraft/simulator');
const TeamcraftSolver = require('@ffxiv-teamcraft/crafting-solver');
const XIVAPI = require('xivapi-js');

const { api_key } = require('../config.json');

module.exports = {
	name: 'teamcraft',
	description: 'Use the Teamcraft crafting simulator.',
	async execute(client, message, logger, args) {
		// Functions
		const teamcraft = async (recipe, craft, craftingMacro, stats) => {
			const simulation = new Teamcraft.Simulation(craft, craftingMacro, stats);
			const result = simulation.run();
			const failCause = (reason) => {
				if (reason === "DURABILITY_REACHED_ZERO") return " because the craft's durability hit zero.";
				if (reason === "MISSING_LEVEL_REQUIREMENT") return " because you aren't a high enough level to attempt that craft.";
				if (reason === "NOT_ENOUGH_CP") return " because you don't have enough CP to execute that macro.";
				if (reason === "NOT_SPECIALIST") return " because you can't use Specialist actions without being a Specialist.";
				if (reason === "NO_INNER_QUIET") return " because you didn't execute Inner Quiet when it was required.";
				return ".";
			};
			console.log(result);
			const reliabilityReport = simulation.getReliabilityReport();

			logger.log('info', `Result: ${result.success ? "Success!" : "The craft failed" + failCause(result.failCause) + ","} Quality: ${result.hqPercent}%`);

			return new Discord.RichEmbed()
				.setTitle("Teamcraft Result")
				.setDescription("Click the <:hq:592580720069705740> below this panel to resimulate the craft with high-quality ingredients.")
				.setColor("#0080ff")
				.setThumbnail("https://xivapi.com" + recipe.ItemResult.Icon)
				.addField(recipe.ItemResult.Name, result.success ? "Success!" : "The craft failed" + failCause(result.failCause), true)
				.addField("Quality", result.hqPercent + "%", true)
				.addField("Step Count", result.steps.length, true)
				.addField("Average Quality", reliabilityReport.averageHQPercent + "%", true)
				.addField("Median Quality", reliabilityReport.medianHQPercent + "%", true)
				.addField("Average Success Rate", reliabilityReport.successPercent + "%", true)
				.setFooter("Average and median calculations are based on a simulation of 200 crafts.");
		};
		
		const teamsolve = async (recipe, craft, stats) => {
			const solver = new TeamcraftSolver.Solver(craft, stats);
			const result = solver.run();
			const eScore = solver.evaluate(result);
			
			const actionNames = (actions) => {
				const macroLines = Teamcraft.CraftingActionsRegistry.serializeRotation(actions).map((action) => {
					let waittime = 3;
					
					if (Teamcraft.CraftingActionsRegistry.ALL_ACTIONS.find((el) => el.name === action).action.getType() === "BUFF") waittime = 2;
					
					action = action.split(/(?=[A-Z])/).join(" ");
					if (action.indexOf(" I ") !== -1) action = action.replace(/I /g, "I");
					
					return `/ac "${action}" <wait.${waittime}>`;
				});
				let returnString = "";
				macroLines.forEach((line) => {
					returnString += "\n" + line;
				});
				return returnString;
			};
			
			if (result.length === 0) return new Discord.RichEmbed().setDescription("The simulation failed. You may be unable to craft this item with your current parameters.");
			
			return new Discord.RichEmbed()
				.setTitle("Teamcraft Result")
				.setDescription("Click the <:hq:592580720069705740> below this panel to resimulate the craft with high-quality ingredients.")
				.setColor("#0080ff")
				.setThumbnail("https://xivapi.com" + recipe.ItemResult.Icon)
				.addField(recipe.ItemResult.Name, actionNames(result), true)
				.addField("Solution Score", eScore, true)
				.setFooter("Reliability calculations are based on a simulation of 200 crafts.");
		};
		
		// Code below
		if (message.channel.name !== "bot-spam" && message.channel.type !== "dm") {
			message.delete();
			let reply = await message.reply(`please limit use of that command to DMs or <#551586630478331904>.`);
			return reply.delete(5000);
		}

		const dbURL = `mongodb://localhost:27017/`;
		let db = await client.db.connect(dbURL, { useNewUrlParser: true });
		if (!db) return message.channel.send(`Failed to access database.`);
		var dbo = db.db("prima_db");

		const xiv = new XIVAPI({private_key: `${api_key}`, language: 'en'});

		// Crafter properties
		const NUMERICAL_PROPERTIES = ["craftsmanship", "control", "cp"];
		const BOOLEAN_PROPERTIES = ["specialist"];
		const COMBINED_PROPERTIES = NUMERICAL_PROPERTIES.concat(BOOLEAN_PROPERTIES);

		// Define Job IDs
		const jobIdMap = new Map();
		jobIdMap.set("CRP", 8);
		jobIdMap.set("BSM", 9);
		jobIdMap.set("ARM", 10);
		jobIdMap.set("GSM", 11);
		jobIdMap.set("LTW", 12);
		jobIdMap.set("WVR", 13);
		jobIdMap.set("ALC", 14);
		jobIdMap.set("CUL", 15);

		if (args[0] === "set" || args[0] === "setstats") {
			for (property of NUMERICAL_PROPERTIES) {
				if (args.includes(property)) {
					let $1 = args.indexOf(property);

					this[property] = parseInt(args[$1 + 1]); // We set object properties like this because it cuts down on code, making it easier to add or fix things.

					if (isNaN(this[property])) { // We don't tolerate unclear or hidden property values. We like to know the cost upfront.
						message.reply(`you didn't put your ${property} value after the word ${property}, so I couldn't find that number.`);
						this[property] = undefined; // this["cp"] is the same thing as this.cp, it just allows us to dynamically define stuff.
					}
				}
			}
			for (property of BOOLEAN_PROPERTIES) {
				if (args.includes(property)) {
					let $2 = args.indexOf(property);

					this[property] = args[$2 + 1];
					if (this[property] === "true") this[property] = true;
					if (this[property] === "false") this[property] = false;

					if (typeof this[property] !== 'boolean') {
						message.reply(`you didn't put \`true\` or \`false\` after the word ${property}, so I couldn't find that parameter.`);
						this[property] = undefined;
					}
				}
			}

			var noOptions = true;
			for (property of COMBINED_PROPERTIES) { // Making sure at least one property was set.
				if (typeof this[property] !== 'undefined') {
					noOptions = false;
				}
			}
			if (noOptions) {
				return message.reply(`you didn't provide any data to update.`);
			}

			// Store stats so that the user doesn't need to update them every time.
			var documentData = { id: message.author.id };
			var updateData = { $set: { } };
			var updateString = "";
			for (property of COMBINED_PROPERTIES) {
				if (typeof this[property] !== 'undefined') {
					documentData[property] = this[property];
					updateData.$set[property] = this[property];
					updateString += property + `: ${this[property]}, `
				}
			}

			let craftStats = await dbo.collection("craftstats").findOne({ id: message.author.id });

			if (craftStats) {
				await dbo.collection("craftstats").updateOne({ id: message.author.id }, updateData); // Update if existing.

				logger.log('info', `prima_db: Updated ${message.author.id}: ${updateString}`);
			} else {
				await dbo.collection("craftstats").insertOne(documentData); // Create if nonexistent.

				logger.log('info', `prima_db: Set ${message.author.id}: ${updateString}`);
			}

			message.reply("your stats have been updated!");
		} else if (args.join("") === "get" || args.join("") === "getstats") {
			var errorString = "";
			for (property of NUMERICAL_PROPERTIES) {
				errorString += property + " # "
			}
			for (property of BOOLEAN_PROPERTIES) {
				errorString += property + " true/false "
			}

			let craftStats = await dbo.collection("craftstats").findOne({ id: message.author.id });
			if (!craftStats) return message.reply(`you haven't set your stats yet! Set them with \`~teamcraft set ${errorString}\``);

			let responseString = "";
			for (property of COMBINED_PROPERTIES) {
				responseString += property.charAt(0).toUpperCase() + property.substr(1) + `: ${craftStats[property] ? craftStats[property] : undefined}\n`
			}

			message.reply(`this is your stored data:\n${responseString}`);
		} else if (args[0] === "macro") {
			const splitCommands = message.content.split('/'); // I need to split the message differently than my command handler does it by default. Instead of splitting at whitespace, I split at slashes here.
			var cleanStringArray = [];
			var craftingActionArray = [];

			splitCommands.forEach((element) => {
				if (!element.startsWith("ac ")) return; // Skip if not an action.
				element = element.slice(3); // Remove ac and the space.
				element = element.split(" ");  // Mostly for actions like "Piece by Piece", where "by" isn't capitalized.
				element = element.map((word) => word = word.charAt(0).toUpperCase() + word.substr(1));
				element = element.join(""); // Merge the array back to a string.
				element = element.replace(/(?:<se\.\d>|<wait\.\d>|[^a-zA-Z])/gmu, ""); // Remove colons, quotation marks, etc. and se.#, wait.#
				cleanStringArray.push(element);
			});

			craftingActionArray = Teamcraft.CraftingActionsRegistry.deserializeRotation(cleanStringArray);

			if (typeof craftingActionArray === 'undefined') return message.reply(`no crafting commands were found in that statement.`);

			let updateData = { $set: { macro: cleanStringArray } };
			let documentData = { id: message.author.id, macro: cleanStringArray };

			let craftStats = await dbo.collection("craftstats").findOne({ id: message.author.id });
			if (craftStats) {
				await dbo.collection("craftstats").updateOne({ id: message.author.id }, updateData); // Update if existing.

				logger.log('info', `prima_db: Updated macro for ${message.author.id}:\n${cleanStringArray}`);
			} else {
				await dbo.collection("craftstats").insertOne(documentData); // Create if nonexistent.

				logger.log('info', `prima_db: Set macro for ${message.author.id}:\n${cleanStringArray}`);
			}

			message.reply(`your macro has been saved!`);
		} else if (args.length > 0) {
			var solve = false;
			if (args[0] === "solve") {
				solve = true;
				args = args.slice(1);
			}
			
			//
			// Actual Teamcraft stuff
			//
			var errorString = "";
			for (property of NUMERICAL_PROPERTIES) {
				errorString += property + " # "
			}
			for (property of BOOLEAN_PROPERTIES) {
				errorString += property + " true/false "
			}

			let craftStats = await dbo.collection("craftstats").findOne({ id: message.author.id });

			for (property of COMBINED_PROPERTIES) {
				if (!craftStats || !craftStats[property]) {
					return message.reply(`you haven't set all of your stats yet! Set them with \`~teamcraft set ${errorString}\`.`);
				}
			}

			if (!solve && !craftStats.macro) {
				return message.reply(`you haven't uploaded a macro yet! Upload one with \`~teamcraft macro <commands>\`.`);
			}

			const craftingMacro = Teamcraft.CraftingActionsRegistry.deserializeRotation(craftStats.macro);

			// Pull Lodestone ID from database and map job levels
			let characterData = await dbo.collection("xivcharacters").findOne({ id: message.author.id });
			if (!characterData || !characterData.lodestone) return message.reply(`you don't seem to have registered your character yet. Register your character with \`~iam World Name Surname\` before using this command. I need this data to pull your crafter levels from the API.`);

			let lodestoneData = await xiv.character.get(characterData.lodestone);

			const jobLevelMap = new Map();

			for (job in lodestoneData.Character.ClassJobs) {
				let jobID = parseInt(lodestoneData.Character.ClassJobs[job].JobID);

				if (jobID >= 8 && jobID <= 15) {
					jobLevelMap.set(jobID, parseInt(lodestoneData.Character.ClassJobs[job].Level));
				}
			}

			// HQ and Quick Synth toggles (before items search)
			let hq = 0;
			if (args.includes("hq")) {
				args.splice(args.indexOf("hq"), 1);
				hq = 1;
			}

			let quickSynth = 0;
			if (args.includes("quicksynth")) {
				args.splice(args.indexOf("quicksynth"), 1);
				quickSynth = 1;
			}

			// Set recipe
			if (args.length === 0) return message.reply(`please provide an item to craft.`);

			let items = await xiv.search(args.join(" "));
			if (!items.Results[0]) {
				return message.reply(`no such item was found in the database.`);
			}

			let recipe;
			for (entry of items.Results) {
				if (entry.UrlType === "Recipe") {
					recipe = JSON.parse(await request("https://xivapi.com/recipe/" + entry.ID)); // There's no recipe endpoint in the JS API.
					break;
				}
			}

			const userJob = recipe.ClassJob.Abbreviation;

			var craft = {
				"id": recipe.ID,
				"job": recipe.ClassJob.ID,
				"rlvl": recipe.RecipeLevelTable.ID,
				"durability": recipe.RecipeLevelTable.Durability,
				"quality": recipe.RecipeLevelTable.Quality,
				"progress": Math.floor(recipe.RecipeLevelTable.Difficulty / 2),
				"lvl": recipe.RecipeLevelTable.ClassJobLevel,
				"suggestedCraftsmanship": recipe.RecipeLevelTable.SuggestedCraftsmanship,
				"suggestedControl": recipe.RecipeLevelTable.SuggestedControl ? recipe.RecipeLevelTable.SuggestedControl : recipe.RequiredControl,
				"stars": recipe.RecipeLevelTable.Stars,
				"hq": hq,
				"quickSynth": quickSynth,
				"ingredients": []
			};

			for (var i = 0; i <= 9; i++) {
				if (recipe[`AmountIngredient${i}`] > 0) {
					craft.ingredients.push({
						"id": recipe[`ItemIngredient${i}ID`],
						"amount": recipe[`AmountIngredient${i}`]
					});
				}
			}

			// Set stats
			const STATS = new Teamcraft.CrafterStats(
				jobIdMap.get(userJob),					// User job
				craftStats.craftmanship,				// Craftsmanship
				craftStats.control,						// Control
				craftStats.cp,							// CP
				craftStats.specialist,					// Specialist
				jobLevelMap.get(jobIdMap.get(userJob)),	// User job level
				[
					jobLevelMap.get(jobIdMap.get("CRP")),
					jobLevelMap.get(jobIdMap.get("BSM")),
					jobLevelMap.get(jobIdMap.get("ARM")),
					jobLevelMap.get(jobIdMap.get("GSM")),
					jobLevelMap.get(jobIdMap.get("LTW")),
					jobLevelMap.get(jobIdMap.get("WVR")),
					jobLevelMap.get(jobIdMap.get("ALC")),
					jobLevelMap.get(jobIdMap.get("CUL")),
				]
			);

			let resultMessage;
			if (solve) {
				resultMessage = await message.channel.send(new Discord.RichEmbed().setDescription("<a:loading:596753619403931657>"));
				var embeddable = await teamsolve(recipe, craft, STATS);
				await resultMessage.delete();
				resultMessage = await message.channel.send(embeddable);
			} else {
				resultMessage = await message.channel.send(new Discord.RichEmbed().setDescription("<a:loading:596753619403931657>"));
				var embeddable = await teamcraft(recipe, craft, craftingMacro, STATS);
				await resultMessage.delete();
				resultMessage = await message.channel.send(embeddable);
			}

			resultMessage.react("592580720069705740");
			let collector = resultMessage.createReactionCollector((reaction, user) => reaction.emoji.id === "592580720069705740" && user.id !== client.user.id, { time: 1800000 });
			collector.once("collect", async (reaction) => {
				craft.ingredients = [];
				for (var i = 0; i <= 9; i++) {
					if (recipe[`AmountIngredient${i}`] > 0) {
						let nextItem = await xiv.search(recipe[`ItemIngredient${i}`].Name);
						let ingredient;
						for (entry of nextItem.Results) {
							if (entry.UrlType === "Recipe") {
								ingredient = JSON.parse(await request("https://xivapi.com/recipe/" + entry.ID));
								break;
							}
						}

						let quality = ingredient ? ingredient.RecipeLevelTable.Quality : 0;

						craft.ingredients.push({
							"id": recipe[`ItemIngredient${i}ID`],
							"amount": recipe[`AmountIngredient${i}`],
							"quality": quality
						});
					}
				}
				
				if (solve) {
					resultMessage.edit(await teamsolve(recipe, craft, STATS));
				} else {
					resultMessage.edit(await teamcraft(recipe, craft, craftingMacro, STATS));
				}
			});
		} else if (args.length === 0 || args.join("") === "help") {
			message.author.send(commontags.stripIndents`
				Welcome to the Teamcraft simulator! To begin simulating crafts, just follow the steps below.
				:zero: Make sure you've linked a character with \`~iam World Firstname Lastname\`.
				This allows the program to pull crafter levels from XIVAPI, so you don't have to enter them in manually.
				:one: Set your stats with \`~teamcraft set craftmanship # control # cp # specialist true/false\`.
				If you ever want to view your saved stats, just use \`~teamcraft get\`
				:two: Input your macro with \`~teamcraft macro <macro>\`. Paste your macro in place of <macro> like so:
				\`\`\`
				~teamcraft macro
				/ac "Observe"
				/ac "Focused Touch"
				(etc.)
				\`\`\`
				:three::regional_indicator_a: Simulate a craft with \`~teamcraft item name\`!
				After the simulation is finished, you can retry it with high-quality ingredients by clicking on the <:hq:592580720069705740> button on the resulting panel.
				:three::regional_indicator_b: Generate a craft macro with \`~teamcraft solve item name\`!
				After a solution is found, you can copy the result into your game.
			`);
		}

		db.close();
	}
}
