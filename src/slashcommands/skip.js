const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const ServerQueue = require('../../entity/ServerQueue');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Pular música!'), 
    async execute(interaction) {
        await interaction.deferReply();
        await skipMusic(interaction); 
    }
};

async function skipMusic(interaction) {
    
    /** @type {ServerQueue} */
    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (!serverQueue) {
        return await interaction.editReply('**Nada para pular**');
    }

    if (serverQueue.getBuffering() === true) {
        return await interaction.editReply('**Aguarde!**');
    }

    serverQueue.musicSystem.skip();
    // await interaction.editReply(`*Skipado por* ${interaction.user.username}`);
    await interaction.editReply('⏭️ ``/skip``');

    // const msg = await interaction.fetchReply();
    // msg.react('⏭️');
    // player.stop();
}
