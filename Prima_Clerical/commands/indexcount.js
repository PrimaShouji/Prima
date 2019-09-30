const commontags = require('common-tags');

const { mod_roles } = require('../config.json');

module.exports = {
	name: 'indexcount',
	async execute(client, message, logger, args) {
        if (!message.member.roles.some(roles => mod_roles.includes(roles.name))) return;

		var dbo = (await client.db).db("prima_db");

        await message.channel.send(commontags.stripIndents`
            Complete documents are those that contain a character name, World, Lodestone ID, and avatar.
            Counting all complete documents, please wait...
        `);
		let count = await dbo.collection("xivcharacters").countDocuments({ world: {"$exists":1}, name: {"$exists":1}, lodestone: {"$exists":1}, avatar: {"$exists":1} });
        await message.channel.send(`There are ${count} complete documents.`);
        logger.log('info', `There are ${count} complete documents.`);
	}
}
