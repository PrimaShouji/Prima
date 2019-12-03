module.exports = async (client, logger, message) => {
    const user = client.user;
    logger.info("Logged in as " + user.tag);
};
