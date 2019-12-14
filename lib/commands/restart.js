const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
    permissionLevel: "Administrator",
	async execute: (client, logger, message) {
		const domains = fs.readdirSync(path.join(__dirname, "../.."))
            .filter((fileName) => fileName.startsWith("prima-"))
            .map((fileName) => return fileName.substr(0, fileName.lastIndexOf(".")));

        if (args.length > 0) {
            if (domains.includes(args[0]))
			setTimeout(() => {
				exec("pm2 restart " + args[0]);
			}, 5000);
		} else {
			setTimeout(() => {
				for (const domain of domains) {
                    exec("pm2 restart " + domain);
                }
			}, 5000);
		}
	},
};
