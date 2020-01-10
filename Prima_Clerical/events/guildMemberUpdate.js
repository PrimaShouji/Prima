const { error_channel } = require('../config.json');

function resetNickname(userData, member) {
	let nickname = `(${userData.world}) ${userData.name}`;
	if (nickname.length > 32) {
		nickname = userData.name; // FFXIV character names are capped at 32 characters.
	}

	return member.setNickname(nickname);
}

module.exports = async (client, logger, oldMember, newMember) => {
	logger.info("Setting nickname for " + oldMember.user.tag);

	const statusChannel = newMember.guild.channels.find(ch => ch.name === error_channel);

	if (oldMember.nickname === newMember.nickname) return; // They might just be editing their avatar or something.

	var dbo = (await client.db).db("prima_db");

	dbo.collection("xivcharacters").findOne({ id: newMember.id }, async (err, res) => {
		if (!res) return logger.info("No DB info."); // If they aren't registered, fallback and treat them like normal.

		logger.info("Found DB info for " + oldMember.user.tag);

		if (!newMember.nickname) { // They want no flair.
			logger.info("Removing flair for " + oldMember.user.tag);
			return newMember.setNickname(res.name).catch((e) => {
				logger.error(e);
			});
		}

		// Return if the end of their nickname is their character name.
		if (newMember.nickname.substr(newMember.nickname.length - res.name.length, res.name.length) === res.name) {
			// If they don't have any flair, reset their nickname if they're trying anything weird.
			if (newMember.nickname.length !== res.name.length && newMember.nickname.charAt(0) !== '('
				|| newMember.nickname.slice(newMember.nickname.indexOf(")") + 1, newMember.nickname.length - res.name.length) !== " ") {
				logger.info("Resetting nickname of " + oldMember.user.tag);
				return resetNickname(res, newMember).catch((e) => {
					logger.error(e);
				});
			}
			logger.info("Nothing to do.");
			return;
		}

		// Format and set their new nickname.
		let nickname = `(${newMember.nickname}) ${res.name}`;
		if (nickname.length > 32) { // Discord will return "nick: Must be 32 or fewer in length." otherwise.
			await newMember.user.send(`Because of Discord's limitations, nicknames must be 32 characters or fewer in length.`);
			logger.info("Resetting nickname of " + oldMember.user.tag);
			return resetNickname(res, newMember).catch((e) => {
				logger.error(e);
			});
		}

		logger.info("Setting nickname of " + oldMember.user.tag + " to " + nickname);
		newMember.setNickname(nickname).catch((e) => {
			logger.error(e);
		});

		statusChannel.send(`User ${oldMember.nickname} changed their nickname to ${newMember.nickname}.`);
	});
}
