const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Replies Server informations!')
        .addStringOption(opt =>
            opt.setName('info')
                .setRequired(true)
                .setDescription('Server informations')
                .addChoice('Server Name', 'name')
                .addChoice('Total Members', 'memberCount')),
    async execute(interaction) {

        if (interaction.options.get('info').value === 'name') {
            await interaction.reply({ content: interaction.guild.name });

        } else if (interaction.options.get('info').value === 'memberCount')
            await interaction.reply({ content: `${interaction.guild.memberCount} total members` });
    }
};