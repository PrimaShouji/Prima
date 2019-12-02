const path = require("path");

const hasPermissions = require("../util/hasPermissions");

const { prefix } = require("../../config.json");

const commands = new Map();

module.exports = async (client, logger, message) => {
    // Validation
    if (!client) {
        return message.channel.send("No client.");
    }

    // Instance tracking
    const token = Date.now();

    // Command validation
    if (!message.content.startsWith(prefix)) return;
    message.content = message.content.slice(prefix.length);

    if (message.author.id === client.user.id) return;

    // Message breakdown
    message.args = message.content.split(/\s+/g).filter((arg) => arg !== "");
    const commandName = message.args[0].toLowerCase();

    logger.info(`{${token}} ${message.author.tag}: ${prefix}${commandName}`);

    message.args = message.args.slice(1);

    // Fetch command
    let command;
    if (commands.get(commandName)) {
        command = commands.get(commandName);
    } else {
        try {
            // Add to map
            command = require(path.join(__dirname, `../commands/${commandName}`));
            commands.set(commandName, command);
        } catch (err) {
            return logger.info(`{${token}} ${commandName} is not a valid command. ${err}`);
        }
    }

    // Verify domain
    if (command.domain && command.domain !== client.domain) return;

    // Verify privileges
    if (command.permissionLevel) {
        if (!message.guild) {
            const member = client.guilds.find((guild) => {
                guild.members.get(message.author.id)
            }).members.get(message.author.id);

            if (!member.roles) {
                logger.info(`{${token}} Insufficient permissions.`);
                return message.reply(`that command is restricted to users of permission level ${command.permissionLevel} or higher.`)
            };
        } else if (message.member && message.member.roles && !hasPermissions(command.permissionLevel, message.member)) {
            logger.info(`{${token}} Insufficient permissions.`);
            return message.reply(`that command is restricted to users of permission level ${command.permissionLevel} or higher.`);
        }
    }

    // Run command
    logger.info(`{${token}} Command executed.`);
    await command.execute(client, logger, message);
    logger.info(`{${token}} Command resolved.`);
};
