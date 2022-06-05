const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const ServerQueue = require('../../entity/ServerQueue');
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

    /** @type {ServerQueue} */
    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (!serverQueue) {
        return await interaction.editReply('**Nada para parar**');
    }

    if (serverQueue.getBuffering() === true) {
        return await interaction.editReply('**Aguarde!**');
    }

    // await serverQueue.player.stop();
    // await serverQueue.connection.destroy();

    serverQueue.musicSystem.stop();
    
    // await interaction.editReply(`*Parado por* ${interaction.user.username}`);
    await interaction.editReply('🛑 ``/stop``');

    await interaction.client.queue.delete(interaction.guild.id);

    // const msg = await interaction.fetchReply();
    // msg.react('🛑');
}
