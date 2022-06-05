const fs = require('fs');
const { Collection } = require('discord.js');
const { prefix } = require('../../config.json');

// const { getData, getTracks } = require('spotify-url-info');

module.exports = {
	name: 'messageCreate',
	async execute(message) {
		if (!message.guild) return;
		if (!message.client.application?.owner)
			await message.client.application?.fetch();
		if (!message.content.startsWith(prefix)) return;

		const commandBody = message.content.slice(prefix.length);
		const args = commandBody.split(' ');
		const command = args.shift().toLowerCase();

		if (
			command === 'deploy' &&
			message.author.id === message.client.application?.owner.id
		) {
			deployCommands(message);
		}

		// if (command === 'spt' && args.length === 1) {
		//    getTracks(args[0]).then(r => {
		//        const tracks = [];
		//        r.forEach(track => {
		//            tracks.push({title: track.name, artists: track.artists[0]?.name});
		//        });
		//        console.log(tracks);
		//    });
		// }

		// if (command === 'spd' && args.length === 1) {
		//    getData(args[0]).then(r => {
		//        console.log('getTracks: ', r);
		//    const tracks = [];
		//    r.forEach(track => {
		//        tracks.push({title: track.name, artists: track.artists[0]?.name});
		//    });
		//    console.log(tracks);
		//    });
		// }
	},
};

function deployCommands(message) {
	message.client.commands = new Collection();
	const commandFiles = fs
		.readdirSync('./src/slashcommands')
		.filter((file) => file.endsWith('.js'));
	console.log(`Command Files: ${commandFiles}`);

	for (const file of commandFiles) {
		const command = require(`../slashcommands/${file}`);

		message.guild.commands.create(command.data);

		message.client.commands.set(command.data.name, command);
	}
	console.log('Deployed!');
}
