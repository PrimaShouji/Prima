const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
	name: 'whatisthis',
	guildOnly: true,
	description: 'Explains what this channel is for.',
	execute(client, message, logger, args) {
		if (!fs.existsSync(`helpfiles/${message.guild.id}/`)){
			fs.mkdirSync(`helpfiles/${message.guild.id}/`);
		}
		
		fs.readdir(`helpfiles/${message.guild.id}`, (err1, files) => {
			if (err1) throw err1;
			
			if (files.indexOf(`${message.channel.name}.txt`) !== -1) {
				fs.readFile(`helpfiles/${message.guild.id}/${message.channel.name}.txt`, (err2, data) => {
					data = data.toString();
					helpEmbed = new Discord.RichEmbed()
						.setColor('#0080ff')
						.setTitle(`#${message.channel.name}`)
						.setThumbnail(`http://www.newdesignfile.com/postpic/2016/05/windows-8-help-icon_398417.png`)
						.setDescription(data);
					message.channel.send(helpEmbed);
				});
			} else {
				return;
			}
		});
	},
};