const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Retorno o nome do usuário!'),
    async execute(interaction) {
        console.log(`Your username is ${interaction.user.username}`);
        await interaction.reply({ content: `Your username is ${interaction.user.username}`});
    }
};