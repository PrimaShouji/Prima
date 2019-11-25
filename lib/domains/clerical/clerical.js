const domain = "clerical";

// Dependencies
const Discord              = require("discord.js");
const fs                   = require("fs");

const ensureConfig         = require("../util/ensureConfig");

// Config load/creation
const { token } = ensureConfig("../../config.json");

// Bot client initialization
const client = new Discord.Client();

// Resources
const db = MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true });

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
    const eventName = client.eventFiles[i].substr(0, client.eventFiles[i].indexOf("."));
    client.removeAllListeners(eventName);
    const boundEvent = client.on(
        eventName,
        e.bind(null, client);
    );
    client.boundEvents.push(boundEvent);
}

// Domain setup
process.on("message", async (msg) => {
    if (msg !== "init") return;

    client.db = (await db).db("prima_db");

    client.login(token).catch((err) => {
        process.send("error", `${err.message}\n${err.stack}`);
        process.exit(1);
    });
});
