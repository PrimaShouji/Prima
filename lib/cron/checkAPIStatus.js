const request = require("request-promise");

module.exports = {
    interval: "*/5 * * * *",
    domain: "clerical",
    async execute(client, logger) {
        const res = await request("https://status.discordapp.com/api/v2/status.json");
        if (res.status.description !== "All Systems Operational") {
            await client.user.setPresence({
                game: {
                    name: res.status.description,
                    type: "PLAYING"
                }
            });
        } else if (client.user.presence.equals({
            game: {
                name: res.status.description,
                type: "PLAYING"
            }
        })) {
            await client.user.setPresence({
                game: {
                    name: "you",
                    type: "LISTENING"
                }
            });
        }
    }
};
