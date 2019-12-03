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
const eventFiles = fs.readdirSync("./lib/events/").filter((fileName) => fileName.endsWith(".js"));
for (let i = 0; i < eventFiles.length; i++) {
    const e = require("./lib/events/" + eventFiles[i]);
    const eventName = eventFiles[i].substr(0, eventFiles[i].indexOf("."));
    if (e.domain && e.domain !== client.domain) continue;

    if (client.listeners(eventName)) {
        if (e.domain) client.removeAllListeners(eventName);
    }

    client.on(
        eventName,
        e.bind(null, client, logger)
    );
}

client.login(token)
.then(() => {
    client.sheets = new GoogleSheets();
});
