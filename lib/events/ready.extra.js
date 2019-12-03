module.exports = async (client, logger, message) => {
    const user = client.user;
    logger.info("Logged in as " + user.tag);
    await user.setPresence({
        game: {
            name: "you",
            type: "LISTENING"
        }
    });
};

module.exports.domain = "extra";
