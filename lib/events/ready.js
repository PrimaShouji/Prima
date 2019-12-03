module.exports = async (client, logger, message) => {
    const user = client.user;
    console.log("Logged in as " + user.tag);
};
