// Check every six hours if there's a new post from @PopTartADay
const fs = require('fs');
const twitter = require('twitter');
const { Attachment } = require('discord.js');

const {
	arsenal_guild_id,
	twitter_consumer_key,
	twitter_consumer_secret,
	twitter_access_token,
	twitter_access_secret
} = require('../config.json');

module.exports = {
	cronstring: '0 */6 * * *',
	execute(client, logger) {
		var twitterClient = new twitter({
			consumer_key: twitter_consumer_key,
			consumer_secret: twitter_consumer_secret,
			access_token_key: twitter_access_token,
			access_token_secret: twitter_access_secret
		});
		
		var victimChannel = client.guilds.get(arsenal_guild_id).channels.find(ch => ch.name === "general");
		
		fs.readFile('./PopTartADay.txt', (err1, url) => {
			if (err1) throw err1;
			
			url = url.toString();
			
			twitterClient.get('search/tweets', { q: 'from:PopTartADay', result_type: 'recent', count: '1' }, (err2, tweet, response) => {
				if (err2) throw err2;
				
				if (!tweet || !tweet.statuses[0] || !tweet.statuses[0].extended_entities) return;
				
				const new_url = tweet.statuses[0].extended_entities.media[0].media_url;
				const media = new Attachment(new_url);
				
				if (url.indexOf(new_url) !== -1) {
					return;
				} else {
					victimChannel.send(`Here is your daily dose of breakfast:`).then(() => {
						victimChannel.send(media);
					});
					
					fs.appendFile('./PopTartADay.txt', `${new_url}\n`, (err3) => {
						if (err3) throw err3;
					});
				}
			});
		});
	}
}