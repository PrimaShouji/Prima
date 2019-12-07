module.exports = {
	interval: "* * * * * *",
	domain: "moderation",
	async execute(client, logger) {
		const dbo = (await client.db).db(client.dbName);

        const entries = await dbo.collection("tempbans").find({}).toArray();

        if (!entries) {
            logger.info("No tempbans.");
            return;
        }

        for (const entry of entries) {
            try {
                const guild = client.guilds.get(entry.guild);
                const member = await guild.fetchMember(entry.user);

                logger.info(`${member.user.tag} => Ban expired? ${entry.timestamp} > ${Date.now()}: ${entry.timestamp <= Date.now()}`);

                if (entry.timestamp > Date.now()) {
                    if (member) {
                        logger.info("Kicked user for being present: " + member.user.tag);

                        if (entry.rejoinAttempts) {
                            await dbo.collection("tempbans").updateOne(entry, {
                                $inc: {
                                    rejoinAttempts: 1,
                                },
                            });
                        } else {
                            await dbo.collection("tempbans").updateOne(entry, {
                                $set: {
                                    rejoinAttempts: 1,
                                },
                            });
                        }

                        await member.kick();
                    }
                }
            } catch (err) {}
        }
	}
}
