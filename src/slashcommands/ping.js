const { SlashCommandBuilder } = require('@discordjs/builders');
const wait = require('util').promisify(setTimeout);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde Pong!'),
    async execute(interaction) {
        await interaction.reply({ content:'Pong!' });
        await wait(1000);
        await interaction.editReply({ content:'Pong!!!' });
    }
};