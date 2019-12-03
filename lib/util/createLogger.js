const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file")

module.exports = () => {
    return winston.createLogger({
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
};
