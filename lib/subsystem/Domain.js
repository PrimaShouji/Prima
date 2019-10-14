const chalk    = require("chalk");
const { fork } = require("child-process");
const path     = require("path");

class Domain {
    constructor(domain, options) {
        if (!options || !options.logger) {
            throw new Error("No options or logger provided.");
        }

        this.domain = domain;
        this.options = options;
        this.logger = options.logger;

        try {
            this.childProcess = this.start(options);
        } catch(err) {
            logger.error(`Domain path or entrypoint not found!\n${err.stack}`);
            return;
        }

        this.childProcess.on("message", this.handler);
        this.childProcess.on("close", this.onClose);
    }

    handler(msg) {
        if (msg.type === "error") {
            this.logger.error(msg.error.stack);
        }
    }

    start(domain, options) {
        this.logger.info(`Starting domain ${chalk.bgYellow.black(domain)}...`);
        try {
            const pathToDomain = path.join(__dirname, `../domains/${domain}/`);
            const childProcess = fork(path.join(pathToDomain, `./${domain}.js`), null, {
                cwd: pathToDomain,
                silent: true
            });
            childProcess.send("message", options);
            return childProcess;
        } catch(err) {
            // Recurse rather than crash the program.
            // We are willing to let domain subprocesses crash, we are not willing to let the main program crash.
            this.onClose(`FORK ERROR: ${err.message}, stack trace: ${err.stack}`);
        }
        this.logger.info(`Domain ${chalk.bgGreenBright.black(domain)} started!`);
    }

    onClose(code) {
        this.logger.error(`Domain ${chalk.bgRedBright.black(this.domain)} closed with code ${code}, restarting...`);
        this.childProcess = this.start(this.domain, this.options);
    }
}

module.exports = Domain;
