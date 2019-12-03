const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    const eventFiles = fs.readdirSync(path.join(__dirname, "../events/")).filter((fileName) => fileName.endsWith(".js"));
    for (let i = 0; i < eventFiles.length; i++) {
        const e = require(path.join(__dirname, "../events/", eventFiles[i]));
        const eventName = eventFiles[i].substr(0, eventFiles[i].indexOf("."));
        if (e.domain && e.domain !== client.domain) continue;

        if (e.domain && client.listeners(eventName)) client.removeAllListeners(eventName);

        client.on(
            eventName,
            e.bind(null, client, client.logger),
        );
    }
};
