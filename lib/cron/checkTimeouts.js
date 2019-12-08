module.exports = {
	interval: "* * * * * *",
	domain: "moderation",
	async execute(client, logger) {
		const dbo = (await client.db).db(client.dbName);

        const entries = await dbo.collection("timeouts").find({}).toArray();

        for (const entry of entries) {
            try {
                const guild = client.guilds.get(entry.guild);
                const member = await guild.fetchMember(entry.user);

				const timeOutRole = guild.roles.find((role) => role.name === "Time Out");

                // logger.info(`${member.user.tag} => Timeout expired? ${entry.timestamp} < ${Date.now()}: ${entry.timestamp < Date.now()}`);

                if (entry.timestamp < Date.now()) {
                    if (member) {
                        logger.info("Removed user from timeout: " + member.user.tag);

						await member.removeRole(timeOutRole);
                        await member.addRoles(entry.prevRoles);
						await dbo.collection("timeouts").drop(entry);
                    }
                } else {
					if (!member.roles.get(timeOutRole.id)) {
						await member.addRole(timeOutRole);
					}
				}
            } catch (err) {}
        }
	}
}
