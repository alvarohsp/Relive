const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play youtube music!')
        .addStringOption(option => 
            option.setName('URL')
                .setDescription('Song name of URL')
                .setRequired(true)),
    async execute(interaction) {
        console.log(interaction);
       
    }
};