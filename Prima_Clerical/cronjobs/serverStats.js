// Updates the server population statistics every day, starting from server join date.
// (5/13/19 in the case of CBA)

const fs = require('fs');
const { arsenal_guild_id } = require('../config.json');

module.exports = {
	cronstring: '0 0 * * *',
	execute(client, logger) {
		const guild = client.guilds.get(arsenal_guild_id);
		const currentPopulation = guild.memberCount;
		
		const file = `stats/${guild.id}/population.txt`
		
		if (!fs.existsSync(`stats/${guild.id}/`)){
			fs.mkdirSync(`stats/${guild.id}/`);
		}
		
		fs.appendFile(file, `${currentPopulation},`, (err) => {
			if (err) throw err;
			
			logger.log(`info`, `Server statistics have been updated.`);
		});
	}
}