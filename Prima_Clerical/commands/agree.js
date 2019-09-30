const { timeout_role } = require('../config.json');

module.exports = {
	name: 'agree',
	description: `Agree to the rules.`,
	execute(client, message, logger, args) {
		message.guild.fetchMember(message.author.id).catch((e) => {});
		message.delete().catch((e) => {});
		
		const dbURL = `mongodb://localhost:27017/`;
		
		if (message.channel.name === 'welcome') {
			if (!message.guild.members.find(mem => mem.id === message.author.id).roles.some(role => timeout_role === role.name)) {
				client.db.connect(dbURL, { useNewUrlParser: true }, (err, db) => {
					if (err) throw err;
					
					var dbo = db.db("prima_db");
					
					dbo.collection("xivcharacters").findOne({ id: message.author.id }, (err, res) => {
						if (!res) return message.reply(`you don't seem to have registered your character yet. Register your character with \`~iam World Name Surname\`.`).then((m) => m.delete(10000));
						
						message.guild.members.find(mem => mem.id === message.author.id).addRole(message.guild.roles.find(role => role.name === "Member")).then((mem) => {
							logger.log('info', `${message.author.tag} added to Member.`);
						}).catch((error) => {
							logger.log('error', `Couldn't assign role Member to ${message.author.tag}.`);
						});
					});
				});
			}
		}
	}
}