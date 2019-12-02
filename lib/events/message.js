const hasPermissions = "../util/hasPermissions";

const commands = new Map();

module.exports = async (client, logger, message) => {
    // Validation
    if (!client) {
        return message.channel.send("No client.");
    }
    if (message.author.id === client.user.id) return;

    // Message breakdown
    message.args = message.content.split(/\s+/g).filter((arg) => arg !== "");
    const commandName = message.args[0].toLowerCase();
    message.args = message.args.slice(1);

    // Fetch command
    let command;
    if (commands.get(commandName)) {
        command = commands.get(commandName);
    } else {
        try {
            command = require(`../commands/${commandName}`);
        } catch {
            return;
        }
    }

    // Add to map
    commands.set(commandName, command);

    // Verify domain
    if (command.domain && command.domain !== client.domain) return;
    // Verify privileges
    if (command.permissionLevel) {
        if (!message.guild) {
            const member = client.guilds.find((guild) => {
                guild.members.get(message.author.id)
            }).members.get(message.author.id);

            if (!member.roles) return message.reply(`That command is restricted to users of permission level ${command.permissionLevel} or higher.`);
        } else if (message.member && message.member.roles) {
            if (!hasPermissions(command.permissionLevel, message.member)) return;
        } else {
            return message.reply(`That command is restricted to users of permission level ${command.permissionLevel} or higher.`);
        }
    }

    // Run command
    command.execute(client, message);
};
