const { SlashCommandBuilder } = require('@discordjs/builders');
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

    const serverQueue = interaction.client.queue.get(interaction.guild.id);
    if (!serverQueue) {
        return await interaction.editReply('**Nada para pular**');
    }

    if (serverQueue.buffering === true) {
        return await interaction.editReply('**Aguarde!**');
    }

    const player = serverQueue.player;
    // await interaction.editReply(`*Skipado por* ${interaction.user.username}`);
    await interaction.editReply('⏭️ ``/skip``');

    // const msg = await interaction.fetchReply();
    // msg.react('⏭️');
    player.stop();
}
