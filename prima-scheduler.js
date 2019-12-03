// Dependencies
const Discord         = require("discord.js");

const createLogger    = require("./lib/util/createLogger");
const ensureConfig    = require("./lib/util/ensureConfig");
const loadEvents      = require("./lib/util/loadEvents");

const GoogleSheets    = require("./lib/subsystem/GoogleSheets");

// Config load/creation
const { token } = ensureConfig("./config.json");

// Bot client initialization
const client = new Discord.Client();

// Resource setup
client.domain = "scheduler";
client.logger = createLogger();

// Client events
loadEvents(client, client.logger);

// Login
client.login(token)
.then(() => {
    client.sheets = new GoogleSheets();
});
