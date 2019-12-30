// Dependencies
const Discord         = require("discord.js");

const createLogger    = require("./lib/util/createLogger");
const ensureConfig    = require("./lib/util/ensureConfig");
const loadCronJobs    = require("./lib/util/loadCronJobs");
const loadEvents      = require("./lib/util/loadEvents");

// Config load/creation
const { token } = ensureConfig("./config.json");

// Bot client initialization
const client = new Discord.Client();

// Resource setup
client.domain = "clerical";
client.logger = createLogger();

// Client events
loadCronJobs(client);
loadEvents(client);

// Login
client.login(token);
