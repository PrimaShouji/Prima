// Dependencies
const Discord      = require("discord.js");

const createLogger = require("./lib/util/createLogger");
const ensureConfig = require("./lib/util/ensureConfig");
const loadCronJobs = require("./lib/util/loadCronJobs");
const loadEvents   = require("./lib/util/loadEvents");

const Google       = require("./lib/subsystem/Google");

// Config load/creation
const { token }    = ensureConfig("./config.json");

// Bot client initialization
const client = new Discord.Client();

// Resource setup
client.domain = "scheduler";
client.logger = createLogger();

// Client events
loadEvents(client);

// Login
client.login(token)
.then(() => {
    client.calendar = new Google();
    client.sheets = new Google();
    loadCronJobs(client);
});
