// Dependencies
const MongoClient     = require("mongodb").MongoClient;
const winston         = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file")

const Domain          = require("./lib/subsystem/Domain");

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

const domains = {
    clerical:  new Domain("clerical", logger),
    admin:     new Domain("admin", logger),
    scheduler: new Domain("scheduler", logger),
    queue:     new Domain("queue", logger),
    extra:     new Domain("extra", logger),
    restart:   new Domain("restart", logger)
};
