module.exports = (mention) => {
    if (!mention) return;

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        let snowflake = mention.slice(2, -1);

        if (snowflake.startsWith('!')) {
            snowflake = snowflake.slice(1);
        }

        return snowflake;
    }
}
