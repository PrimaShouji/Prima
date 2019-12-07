module.exports = {
	interval: "* * * * *",
	domain: "moderation",
	async execute(client, logger) {
		const dbo = (await db).db(client.dbName);

        const entries = dbo.collection("tempbans").find({}).toArray();

        for (const entry of entries) {
            const guild = client.guilds.get(entry.guild);
            const user = await guild.fetchMember(entry.user);

            if (entry.timestamp < Date.now()) {
                if (user) {
                    await user.kick();
                }
            }
        }
	}
}
