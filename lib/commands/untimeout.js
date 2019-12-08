const getSnowflakeFromMention = require("../util/getSnowflakeFromMention");

module.exports = {
	permissionLevel: "Moderator",
    domain: "moderation",
	execute: async (client, logger, message) => {
        if (!message.guild) return await message.channel.send("Please use this command in the guild you wish to apply it to.");

		const collection = (await client.db).db(client.dbName).collection("timeouts");

        const user = getSnowflakeFromMention(message.args[0]);
		if (!user) {
			return await message.author.send("Please specify a user to remove from timeout.");
		}

        const member = await message.guild.fetchMember(user);

        const entries = await collection.find({ user, guild: message.guild.id }).toArray();
        await member.removeRole(message.guild.roles.find((role) => role.name === "Time Out"));
        await member.addRoles(entries[0].prevRoles);
        await collection.drop(entries);

		await message.author.send(`User ${member.user.tag} removed from timeout in ${message.guild.name}.`);
	},
}
