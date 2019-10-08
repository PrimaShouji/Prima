const request = require('request-promise');
const XIVAPI = require('xivapi-js');

const { api_key } = require('../config.json');

module.exports = {
	name: 'repairdb',
	async execute(client, message, logger, args) {
		const dbURL = `mongodb://localhost:27017/`;
		let db = await client.db.connect(dbURL, { useNewUrlParser: true });
		if (!db) return message.channel.send(`Failed to access database.`);
		var dbo = db.db("prima_db");

		const xiv = new XIVAPI({private_key: `${api_key}`, language: 'en'});

		message.channel.send(`Beginning repair job, please wait (this could take several hours)...`);
		logger.log('info', `Beginning repair job, please wait (this could take several hours)...`);

		let memberCollection = await message.guild.fetchMembers();
		let worldList = JSON.parse(await request("https://xivapi.com/servers"));

		var counter = 0;

		memberCollection.members.forEach(async (member, id, map) => {
			if (!member || !member.nickname) return;

			let world = member.nickname.substr(member.nickname.indexOf("(") + 1, member.nickname.indexOf(")") - 1);
			let name = member.nickname.substr(member.nickname.indexOf(")") + 2);

			logger.log('info', `Adding (${world}) ${name}...`)

			//let character = await xiv.character.search(name, { server: world }).Results[0];

			let currentData = await dbo.collection("xivcharacters").findOne({ id: id });
			if (!currentData) {
				await dbo.collection("xivcharacters").insertOne({ id: id, world: world, name: name});//, lodestone: character.ID, avatar: character.Avatar });
				logger.log('info', `Added (${world}) ${name}.`);
				counter++;
			}
		});

		setTimeout(() => {
			message.channel.send(`Finished repair job with ${counter} entries added.`);
			logger.log('info', `Finished repair job with ${counter} entries added.`);
		}, 3000);
	}
}
