const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausar música!'), 
    async execute(interaction) {
        await interaction.deferReply();
        await pauseMusic(interaction);
        return await interaction.editReply(`*Pausado por* ${interaction.user.username}`);
    }

};

async function pauseMusic(interaction) {

    const player = interaction.client.musicPlayer;

    player.pause();
}
