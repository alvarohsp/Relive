const fs = require('fs');
const { Collection } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log('\x1b[32m%s\x1b[0m', `Pronto - ${client.user.tag}`);
        // console.log(`\x1b[32m\x1b[4mPronto - ${client.user.tag}\x1b[0m`);

        deployCommandsAuto(client);
    }
};

async function deployCommandsAuto(client) {

    const Guilds = client.guilds.cache.map(guild => guild.id);

    client.commands = new Collection();
    const commandFiles = fs.readdirSync('./src/slashcommands').filter(file => file.endsWith('.js'));
    console.log(`Command Files: ${commandFiles}`);


    for (const guild of Guilds) {
        const oneGuild = await client.guilds.resolve(guild);

        for (const file of commandFiles) {
            const command = await require(`../slashcommands/${file}`);     
            oneGuild.commands.set([command.data]);
            client.commands.set(command.data.name, command);
        }
    }

    // for (const file of commandFiles) {
    //     const command = await require(`../slashcommands/${file}`); 
    //     client.commands.set(command.data.name, command);

    // }

    console.log('Deployed!');
}