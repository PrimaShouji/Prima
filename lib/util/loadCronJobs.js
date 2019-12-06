const { CronJob } = require("cron");
const path = require("path");

module.exports = (client) => {
    client.cronJobs = {};

    const cronFiles = fs.readdirSync(path.join(__dirname, "../cron/")).filter((fileName) => fileName.endsWith(".js"));
    for (let i = 0; i < cronFiles.length; i++) {
        const c = require(path.join(__dirname, "../cron/", cronFiles[i]));
        const cronName = cronFiles[i].substr(0, cronFiles[i].indexOf("."));

        if (!c.domain && c.domain !== client.domain) continue;

        client.cronJobs[cronName] = new CronJob(
            c.interval,
            c.execute.bind(null, client, client.logger),
            () => {
                client.logger.info(`CronJob ${cronName} has stopped.`);
            },
            true,
            "America/Los_Angeles",
        );
    }
};
