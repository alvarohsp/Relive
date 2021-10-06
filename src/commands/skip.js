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
    const player = serverQueue.player;
    await interaction.editReply(`*Skipado por* ${interaction.user.username}`);

    const msg = await interaction.fetchReply();
    msg.react('⏭️');
    player.stop();
}
