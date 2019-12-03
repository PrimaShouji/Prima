module.exports = async (client, logger, message) => {
    const user = client.user;
    logger.log("Logged in as " + user.tag);
};
