const chalk    = require("chalk");
const { fork } = require("child_process");
const path     = require("path");

class Domain {
    constructor(domain, logger) {
        if (!logger) {
            throw new Error("No logger provided.");
        }

        this.domain = domain;
        this.logger = logger;

        try {
            this.childProcess = this.start();
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

    start(domain) {
        this.logger.info(`Starting domain ${chalk.bgYellow.black(domain)}...`);
        try {
            const pathToDomain = path.join(__dirname, `../domains/${domain}/`);
            const childProcess = fork(path.join(pathToDomain, `./${domain}.js`), null, {
                cwd: pathToDomain,
                silent: true
            });
            childProcess.send("message", "init");
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
        this.childProcess = this.start(this.domain);
    }
}

module.exports = Domain;
