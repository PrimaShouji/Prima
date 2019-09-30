module.exports = async (client, logger, oldMessage, newMessage) => {
	const CBA_BLACKLIST = [
		"https://tenor.com/view/sohungry-sogood-yummy-food-foodisgood-gif-5571042",
		"nigger"
	];
	
	if (newMessage.guild && newMessage.guild.id === "550702475112480769") {
		for (text of CBA_BLACKLIST) {
			if (newMessage.content.includes(text)) {
				var messageEmbed = new Discord.RichEmbed()
        				.setTitle(`#${newMessage.channel.name}`)
        				.setColor("#0080ff")
     					.setAuthor(`${newMessage.author.tag}`, newMessage.author.avatarURL)
     					.setDescription(newMessage.content)
					.setFooter(`Deleted by: ${client.user.tag}`, client.user.avatarURL)
	   				.setTimestamp();

				newMessage.guild.channels.get("592770213657837587").send(messageEmbed);
				return newMessage.delete();
			}
		}
	}
}