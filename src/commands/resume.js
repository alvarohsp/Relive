const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Continuar música!'), 
    async execute(interaction) {
        await interaction.deferReply();
        await resumeMusic(interaction);
        return await interaction.editReply(`*Despausado por* ${interaction.user.username}`);
    }
};

async function resumeMusic(interaction) {

    const player = interaction.client.musicPlayer;

    player.unpause();
}
