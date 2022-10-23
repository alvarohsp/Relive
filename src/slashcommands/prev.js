const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const ServerQueue = require('../classes/ServerQueue');
module.exports = {
	data: new SlashCommandBuilder().setName('prev').setDescription('Voltar música!'),
	async execute(interaction) {
		await interaction.deferReply();
		await prevMusic(interaction);
	},
};

async function prevMusic(interaction) {
	/** @type {ServerQueue} */
	const serverQueue = interaction.client.queue.get(interaction.guild.id);

	if (!serverQueue) {
		return await interaction.editReply('**Nada para voltar**');
	}

	if (serverQueue.getBuffering() === true) {
		return await interaction.editReply('**Aguarde!**');
	}

	serverQueue.musicSystem.prev();
	await interaction.editReply('⏪ ``/prev``');
}
