// Dependencies
const Discord              = require("discord.js");
const fs                   = require("fs");

const Domain               = require("./lib/subsystem/Domain");
const RSSManager           = require("./lib/subsystem/RSSManager");

const ensureConfig         = require("./lib/util/ensureConfig");

// Config load/creation
const { token } = ensureConfig("./config.json");

// Bot client initialization
const client = new Discord.Client();

// Client events
client.eventFiles = fs.readdirSync("./lib/events").filter((fileName) => fileName.endsWith(".js"));
client.boundEvents = [];
for (let i = 0; i < client.eventFiles.length; i++) {
    const e = require("./lib/events/" + client.eventFiles[i]);
    const boundEvent = client.on(
        client.eventFiles[i].substr(0, client.eventFiles[i].indexOf(".")),
        e.bind(null, client)
    );
    client.boundEvents[i] = boundEvent;
}

// Log in and set up subsystems
client.login(token)
.then(() => {
    client.guild = client.guilds.first();

    client.rssManager = new RSSManager(client, "./rss");

    // Domain setup
    const domains = ["clerical"];//, "extra", "queue", "scheduler", "restart", "admin"];
    client.domains = {};
    for (const domain of domains) {
        client.domains[domain] = new Domain(domain);
    }
})
.catch(console.error);
