// Dependencies
const Discord         = require("discord.js");
const fs              = require("fs");
const { MongoClient } = require("mongodb");
const winston         = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file")

const ensureConfig    = require("./lib/util/ensureConfig");

const GoogleSheets    = require("./lib/subsystem/GoogleSheets");

// Config load/creation
const { token } = ensureConfig("./config.json");

// Bot client initialization
const client = new Discord.Client();

// Resource setup
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new DailyRotateFile({
            datePattern: "YYYY-MM-DD-HH",
            filename: "logs/%DATE%.log",
            maxSize: "20m"
        }),
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error"
        })
    ],
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'HH:mm:ss'
        }),
        winston.format.printf((log) => `[${log.timestamp}][${log.level.toUpperCase()}] - ${log.message}`),
    ),
});

client.domain = "scheduler";

// Client events
client.eventFiles = fs.readdirSync("./lib/events/").filter((fileName) => fileName.endsWith(".js"));
client.boundEvents = [];
for (let i = 0; i < client.eventFiles.length; i++) {
    const e = require("./lib/events/" + client.eventFiles[i]);
    if (e.domain && e.domain !== client.domain) continue;
    const eventName = client.eventFiles[i].substr(0, client.eventFiles[i].indexOf("."));
    client.removeAllListeners(eventName);
    const boundEvent = client.on(
        eventName,
        e.bind(null, client, logger)
    );
    client.boundEvents.push(boundEvent);
}

client.login(token)
.then(() => {
    client.sheets = new GoogleSheets();
});
