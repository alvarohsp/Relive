const { SlashCommandBuilder } = require('@discordjs/builders');
// const wait = require('util').promisify(setTimeout);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Retorna sua entrada')
        .addStringOption(option => 
            option.setName('input')
                .setDescription('Texto para ser retornado')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.reply({ content:`The echo is: ${interaction.options.getString('input')}` });
    }
};