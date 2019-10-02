const { arsenal_guild_id, prefix, mod_roles } = require('../config.json');

const Discord = require('discord.js');

module.exports = {
	name: 'whois',
	cooldown: 0,
	args: true,
	async execute(client, message, logger, args) {
		function getUserFromMention(mention) {
			if (!mention) return;

			if (mention.startsWith('<@') && mention.endsWith('>')) {
				mention = mention.slice(2, -1);

				if (mention.startsWith('!')) {
					mention = mention.slice(1);
				}

				return mention;
			}
		}

		if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;

		if (args.length !== 1) return message.reply(`please enter that command in the format \`${prefix}whois @user\`.`).then((msg) => msg.delete(5000));

        const member = await client.guilds.get(arsenal_guild_id).fetchMember(getUserFromMention(args[0]));

        const dbo = (await client.db).db("prima_db");

        const character = await dbo.collection("xivcharacters").findOne({ id: member.id });

        if (!character) {
            return message.reply(`that user has no data in the database. It may not have been recovered yet.`);
        }

        const output = new Discord.RichEmbed()
            .setColor('#0080ff')
            .setTitle(`(${character.world}) ${character.name}`)
            .setURL(`https://na.finalfantasyxiv.com/lodestone/character/${character.lodestone}/`)
            .setThumbnail(character.avatar);

        message.channel.send(output);
	}
}
