const commontags = require('common-tags');

module.exports = {
	name: 'roll',
	cooldown: 300,
	execute(client, message, logger, args) {
		const res = Math.floor(Math.random() * 4);
		
		if (res === 0) {
			message.channel.send(commontags.stripIndents`
				BINGO! You matched ${Math.floor(Math.random() * 11) + 1} lines! Congratulations!
			`);
		} else if (res === 1) {
			let opt = Math.floor(Math.random() * 2598960) + 1;
			
			if (opt <= 4) {
				message.channel.send(commontags.stripIndents`
					JACK**P**O*T!* Roya**l flush!** You __won__ [%#*(!@] credits*!*
				`);
			} else if (opt > 4 && opt <= 40) {
				message.channel.send(commontags.stripIndents`
					Straight flush! You won [TypeError: Cannot read property 'MUNZ' of undefined] credits!
				`);
			} else if (opt > 40 && opt <= 664) {
				message.channel.send(commontags.stripIndents`
					Four of a kind! You won [TypeError: Cannot read property 'thinking' of undefined] credits!
				`);
			} else if (opt > 664 && opt <= 4408) {
				message.channel.send(commontags.stripIndents`
					Full house! You won [TypeError: Cannot read property '<:GWgoaThinken:582982105282379797>' of undefined] credits!
				`);
			} else if (opt > 4408 && opt <= 9516) {
				message.channel.send(commontags.stripIndents`
					Flush! You won -1 credits!
				`);
			} else if (opt > 9516 && opt <= 19716) {
				message.channel.send(commontags.stripIndents`
					Straight! You won -20 credits!
				`);
			} else if (opt > 19716 && opt <= 74628) {
				message.channel.send(commontags.stripIndents`
					Three of a kind! You won -100 credits!
				`);
			} else if (opt > 74628 && opt <= 198180) {
				message.channel.send(commontags.stripIndents`
					Two pairs...? You won -500 credits!
				`);
			} else if (opt > 198180 && opt <= 1296420) {
				message.channel.send(commontags.stripIndents`
					One pair. You won -2500 credits.
				`);
			} else if (opt > 1296420 && opt <= 2598960) {
				message.channel.send(commontags.stripIndents`
					No pairs. You won -10000 credits.
				`);
			}
		} else if (res === 2) {
			message.channel.send(commontags.stripIndents`
				Critical hit! You dealt ${Math.floor(Math.random() * 9999) + 9999} damage!
			`);
		} else if (res === 3) {
			message.channel.send(commontags.stripIndents`
				You took 9999999 points of damage. You lost the game.
			`);
		}
	}
}