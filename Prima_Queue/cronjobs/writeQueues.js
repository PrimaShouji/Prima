// Back up the queues every hour.
const Prima = require('prima-common.js');

module.exports = {
	cronstring: '* * * * *',
	execute(client, logger) {
		Prima.backupBAQueues(client, logger);
	}
}