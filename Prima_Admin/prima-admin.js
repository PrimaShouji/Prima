const fs = require('fs'); // Enables reading command plugin folder
const readline = require('readline');
const commontags = require('common-tags'); // Text formatting
const winston = require('winston'); // Fast logging
const {google} = require('googleapis'); // For Google Sheets
const cronJob = require('cron').CronJob; // For cyclical actions and for alerts

const Discord = require('discord.js');
const {
	prefix,
	token,
	error_channel
} = require('./config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.cronJobs = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // Load command plugins
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js')); // Load event plugins
const cronFiles = fs.readdirSync('./cronjobs').filter(file => file.endsWith('.js')); // Load cron plugins
client.cooldowns = new Discord.Collection(); // Make a collection of commands on cooldown, currently empty

const logger = winston.createLogger({ // Start winston logging
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: `logs/log${Math.floor(Date.now() / 1000)}.txt` }), // Output to file
	],
	format: winston.format.combine(
		winston.format.timestamp({
		  format: 'HH:mm:ss'
		}),
		winston.format.printf(log => `[${log.timestamp}][${log.level.toUpperCase()}] - ${log.message}`),
	),
});

for(const file of commandFiles) { // Load command plugins
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// Adapted from https://www.youtube.com/watch?v=qmTfNpOaGaQ
// The key difference is that the cached event isn't deleted, this lets us only reload specific events via reloadevent when we need to.
// Efficiency, yeah! :v
for (const file of eventFiles) { // Load events
	const clientEvent = require(`./events/${file}`);
	
	eventName = file.substr(0, file.indexOf('.'));
	client.on(eventName, clientEvent.bind(null, client, logger));
	
	require.resolve(`./events/${file}`);
}

// At this point I understand this well enough to toss something together myself :v
for (const file of cronFiles) { // Load crons
	const cronEvent = require(`./cronjobs/${file}`);
	cronName = file.substr(0, file.indexOf('.'));
	
	client.cronJobs.set(cronName, new cronJob(cronEvent.cronstring, () => cronEvent.execute(client, logger), null, true));
}

process.on('uncaughtException', error => logger.log('error', error));

client.login(token);