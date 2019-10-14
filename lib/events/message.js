const commands = new Map();

module.exports = async (client, message) => {
    // Validation
    if (!client) {
        return message.channel.send("No client.");
    }
    if (message.author.id === client.user.id) return;

    // Message breakdown
    message.args = message.content.split(/\s+/g);
    const commandName = message.args[0].toLowerCase();
    message.args = message.args.slice(1);

    // Fetch command
    let command;
    if (commands.get(commandName)) {
        command = commands.get(commandName);
    } else {
        try {
            command = require(`../commands/${commandName}`);
            commands.set(commandName, command);
        } catch {
            return;
        }
    }

    // Run command
    command.execute(client, message);
};
