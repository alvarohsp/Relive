const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const ServerQueue = require('../classes/ServerQueue');

module.exports = {
	data: new SlashCommandBuilder().setName('pause').setDescription('Pausar música!'),
	async execute(interaction) {
		await interaction.deferReply();
		await pauseMusic(interaction);
	},
};

async function pauseMusic(interaction) {
	/** @type {ServerQueue} */
	const serverQueue = interaction.client.queue.get(interaction.guild.id);

	if (!serverQueue) {
		return await interaction.editReply('**Nada para pausar**');
	}

	serverQueue.musicSystem.pause();

	await interaction.editReply('⏸️ ``/pause``');
}
