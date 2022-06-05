const fs = require('fs');
const { Client, Intents } = require('discord.js');
const { token } = require('../token.json');
const figlet = require('figlet');
const { version } = require('../package.json');

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES,
	],
});

const eventFiles = fs
	.readdirSync('./src/events')
	.filter((file) => file.endsWith('.js'));

const queue = new Map();

client.queue = queue;

console.log(
	'\x1b[36m%s\x1b[0m',
	figlet.textSync('Relive', {
		font: 'Train',
	})
);
console.log(`- Relive ${version} -\n`);

console.log(`Event Files: ${eventFiles}`);

for (const file of eventFiles) {
	const event = require(`./events/${file}`);

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);

/*
    tick: '✔',
	info: 'ℹ',
	warning: '⚠',
	cross: '✖',
*/
