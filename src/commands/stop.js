const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Encerrar música'), 
    async execute(interaction) {
        await interaction.deferReply();
        await stopMusic(interaction);
    }
};

async function stopMusic(interaction) {

    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (!serverQueue) {
        return await interaction.editReply('**Nada para parar**');
    }

    await serverQueue.connection.destroy();
    await interaction.editReply(`*Parado por* ${interaction.user.username}`);

    interaction.client.queue.delete(interaction.guild.id);

    const msg = await interaction.fetchReply();
    msg.react('🛑');
}
