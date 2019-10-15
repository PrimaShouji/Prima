const { error_channel } = require('../config.json');

module.exports = async (client, logger, oldMember, newMember) => {
	const statusChannel = newMember.guild.channels.find(ch => ch.name === error_channel);

	if (oldMember.nickname === newMember.nickname) return; // They might just be editing their avatar or something.

	const dbURL = `mongodb://localhost:27017/`;

	client.db.connect(dbURL, { useNewUrlParser: true }, (err, db) => {
		if (err) return statusChannel.send(err);

		var dbo = db.db("prima_db");

		dbo.collection("xivcharacters").findOne({ id: newMember.id }, (err, res) => {
			if (!res) return; // If they aren't registered, fallback and treat them like normal.

			if (!newMember.nickname) { // No flair.
				return newMember.setNickname(`${res.name}`).catch((e) => {
					logger.log('error', e);
				});
			}

			if (newMember.nickname.charAt(0) !== '(') {
				newMember.setNickname(`(${res.world}) ${res.name}`).catch((e) => {
					logger.log('error', e);
				});
			}
			
			if (newMember.nickname.substr(newMember.nickname.length - res.name.length, res.name.length) === res.name) return; // This is firing on itself.

			var nickname = `(${newMember.nickname}) ${res.name}`;

			newMember.setNickname(nickname).catch((e) => {
				logger.log('error', e);
				if (e.toString().indexOf("nick: Must be 32 or fewer in length.") !== -1) {
					newMember.user.send(`Because of Discord's limitations, nicknames must be 32 characters or fewer in length.`);
					newMember.setNickname(`(${res.world}) ${res.name}`).catch((e) => {
						logger.log('error', e);
					});
				}
			});

			logger.log('warn', `User ${oldMember.nickname} changed their flair to ${newMember.nickname}.`);

			db.close();
		});
	});
}
