// Dependencies
const MongoClient     = require("mongodb").MongoClient;
const winston         = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file")

const Domain          = require("./lib/subsystem/Domain");

// Resource setup
const db = MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true });
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

// Domain setup
const domainOptions = {
    db,
    logger
};

const domains = {
    clerical:  new Domain("clerical", domainOptions),
    admin:     new Domain("admin", domainOptions),
    scheduler: new Domain("scheduler", domainOptions),
    queue:     new Domain("queue", domainOptions),
    extra:     new Domain("extra", domainOptions),
    restart:   new Domain("restart", domainOptions)
};
