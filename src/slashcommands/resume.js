const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Continuar música!'), 
    async execute(interaction) {
        await interaction.deferReply();
        await resumeMusic(interaction);
    }
};

async function resumeMusic(interaction) {

    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (!serverQueue) {
        return await interaction.editReply('**Nada para continuar**');
    }
    const player = serverQueue.player;

    // await interaction.editReply(`*Despausado por* ${interaction.user.username}`);
    await interaction.editReply('⏯️ ``/resume``');

    // const msg = await interaction.fetchReply();
    // msg.react('⏯️');
    player.unpause();
}
