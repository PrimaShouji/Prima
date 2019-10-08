const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
	name: 'setdescription',
	args: true,
	guildOnly: true,
	description: 'Set a help message answer for a channel.',
	execute(client, message, logger, args) {
		const file = `helpfiles/${message.guild.id}/${message.channel.name}.txt`
		
		if (!fs.existsSync(`helpfiles/${message.guild.id}/`)){
			fs.mkdirSync(`helpfiles/${message.guild.id}/`);
		}
		
		args = args.join(" ");
		
		fs.access(file, fs.constants.F_OK, (err) => {
			if (!err) fs.unlinkSync(file);
			
			fs.appendFile(file, args, (err) => {
				if (err) throw err;
				
				logger.log(`info`, `Updated help message for ${message.channel.name}.`);
				message.reply(`the help message has been updated!`);
			});
		})
	}
};