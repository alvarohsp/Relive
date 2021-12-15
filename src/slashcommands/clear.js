const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Limpa lista de reprodução!'), 
    async execute(interaction) {
        await interaction.deferReply();
        await clearMusic(interaction);
    }
};

async function clearMusic(interaction) {

    const serverQueue = interaction.client.queue.get(interaction.guild.id);
    

    if (!serverQueue) {
        return await interaction.editReply('**Nada para limpar**');
    }

    serverQueue.songs = [];
    await serverQueue.player.stop();

    interaction.client.queue.set(interaction.guild.id, serverQueue);

    // await interaction.editReply(`*Lista limpa por* ${interaction.user.username}`);
    await interaction.editReply('🧹 ``/clear``');

    // const msg = await interaction.fetchReply();
    // msg.react('🧹');
}
