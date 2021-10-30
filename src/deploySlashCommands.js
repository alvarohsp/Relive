const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('../token.json');
const fs = require('fs');

const commands = [];
const commandFiles = fs.readdirSync('./src/slashcommands').filter(file => file.endsWith('.js'));

// Place your client and guild ids here
const clientId = '894076760818319421';
const guildId1 = '894071973028720710';
const guildId2 = '822277851537342544';

for (const file of commandFiles) {
	const command = require(`../src/slashcommands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

        await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId1),
			{ body: commands },
		);

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId2),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();