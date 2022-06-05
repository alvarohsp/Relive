const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const ServerQueue = require('../../entity/ServerQueue');
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

    /** @type {ServerQueue} */
    const serverQueue = interaction.client.queue.get(interaction.guild.id);
    

    if (!serverQueue) {
        return await interaction.editReply('**Nada para limpar**');
    }

    serverQueue.musicSystem.clear();
    // await serverQueue.player.stop();

    interaction.client.queue.set(interaction.guild.id, serverQueue);

    // await interaction.editReply(`*Lista limpa por* ${interaction.user.username}`);
    await interaction.editReply('🧹 ``/clear``');

    // const msg = await interaction.fetchReply();
    // msg.react('🧹');
}
