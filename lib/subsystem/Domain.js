const { fork } = require("child-process");
const path = require("path");

class Domain {
    constructor(domain, logger) {
        const pathToDomain = path.join(__dirname, `../domains/${domain}/`);
        this.process = fork(path.join(pathToDomain, `./${domain}.js`), null, {
            cwd: pathToDomain,
            silent: true
        });

        this.logger = logger;

        this.process.on("message", this.handler);
    }

    execute(command) {
        this.process.send({
            type: "command",
            command: command
        });
    }

    handler(msg) {
        if (msg.type === "error") {
            logger.error(msg.error.stack);
        }
    }
}

module.exports = Domain;
