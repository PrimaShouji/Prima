const fs = require('fs');
const gm = require('gm');
const commontags = require('common-tags');
const Discord = require('discord.js');

module.exports = {
	name: "statsout",
	guildOnly: true,
	execute(client, message, logger, args) {
		fs.readFile(`stats/${message.guild.id}/population.txt`, (err1, dataSet) => {
			if (err1) return message.reply(`please wait at least two days for data to be collected.`);
			
			dataSet = dataSet.toString().match(/\d+/g);
			
			if (dataSet.length < 2) return message.reply(`please wait at least two days for data to be collected.`);
			
			var numDays = dataSet.length;
			var netGain = dataSet[dataSet.length - 1] - dataSet[0];
			var avgDailyRate = Math.pow(dataSet[dataSet.length - 1] / dataSet[0], 1 / numDays) - 1;
			var parsedPercRate = `${avgDailyRate * 100}%`;
			var readableDailyRate = netGain / numDays;
			
			if (args && args[0] === "-g") { // Make a line graph
				var chart = gm(600, 400, "#FFF"); // White canvas
				
				chart.drawLine(20, 20, 20, 380); // Vertical bound
				chart.drawLine(20, 380, 580, 380); // Horizontal bound
				
				// Data scale
				var squashFactor = 1;
				dataSet.forEach((element) => {
					element = parseInt(element);
					const sf = element / 360;
					
					if (sf > squashFactor) {
						squashFactor = sf;
					}
				});
				
				for (var i = 1; i < dataSet.length; i++) {
					// Lines
					var x0 = (i - 1) * (560 / dataSet.length) + 20;
					var y0 = 380 - (parseInt(dataSet[i - 1]) / squashFactor);
					var x1 = i * (560 / dataSet.length) + 20;
					var y1 = 380 - (parseInt(dataSet[i]) / squashFactor);
					chart.drawLine(x0, y0, x1, y1);
				}
				
				// Output
				chart.write(__dirname + "\\..\\temp\\stats" + message.guild.id + ".png", (err) => {
					if (!err) {
						message.channel.send(new Discord.Attachment(`temp/stats${message.guild.id}.png`)).then((msg) => {
							fs.unlink("temp/stats" + message.guild.id + ".png", (err) => {
								if (err) throw err;
							});
						});
					}
				});
			} else {
				var stats = new Discord.RichEmbed() // Make the fancy panel like the one Meka has owo
					.setColor('#0080ff')
					.setTitle('Server Stats')
					.setDescription(commontags.stripIndents`
						Current population: ${dataSet[dataSet.length - 1]} users
						Net gain: ${netGain} users over ${numDays - 1} days (${numDays} data points)
						
						First data point: ${dataSet[0]} users
						Most recent data point: ${dataSet[dataSet.length - 1]} users
					`)
					.addField('Average Daily Growth Rate', `${parsedPercRate} (${readableDailyRate} users/day)`, true);
					
				message.channel.send(stats);
			}
		});
	}
};