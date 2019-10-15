const domain = "clerical";

// Dependencies
const Discord              = require("discord.js");
const fs                   = require("fs");

const ensureConfig         = require("../util/ensureConfig");

// Config load/creation
const { token } = ensureConfig("../../config.json");

// Bot client initialization
const client = new Discord.Client();

// Client events
client.eventFiles = fs.readdirSync("./events").filter((fileName) => fileName.endsWith(".js"));
client.eventFiles.concat(fs.readdirSync("../events")
    .filter((fileName) => fileName.endsWith(".js"))
    .map((fileName) => "../events/" + fileName)
);
client.boundEvents = [];
for (let i = 0; i < client.eventFiles.length; i++) {
    const e = require("./events/" + client.eventFiles[i]);
    if (e.domain !== domain) continue;
    const boundEvent = client.on(
        client.eventFiles[i].substr(0, client.eventFiles[i].indexOf(".")),
        e.bind(null, client);
    );
    client.boundEvents.push(boundEvent);
}

// Domain setup
process.on("message", async (msg) => {
    if (msg.type !== "init") return;

    client.db = (await msg.db).db("prima_db");
    client.logger = msg.logger;

    client.login(token).catch((err) => {
        msg.logger.error(`${err.message}\n${err.stack}`);
        process.exit(1);
    });
});
