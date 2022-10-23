const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const ServerQueue = require('../classes/ServerQueue');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription('Repetir música!')
		.addBooleanOption((option) =>
			option
				.setName('habilitar-loop')
				.setDescription('Deseja habilitar o loop?')
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('tipo-do-loop')
				.setRequired(false)
				.setDescription('Escolha o tipo do loop')
				.setChoices(
					{ name: 'Música atual', value: 'music' },
					{ name: 'Playlist inteira', value: 'playlist' }
				)
		),
	async execute(interaction) {
		await interaction.deferReply();
		await loopMusic(interaction);
	},
};

async function loopMusic(interaction) {
	/** @type {ServerQueue} */
	const serverQueue = interaction.client.queue.get(interaction.guild.id);

	if (!serverQueue) {
		return await interaction.editReply('**Não há músicas**');
	}

	const enableLoop = interaction.options.getBoolean('habilitar-loop');

	const loopType = interaction.options.getString('tipo-do-loop');

	serverQueue.musicSystem.setLoop(enableLoop, loopType);
	await interaction.editReply('🔄 ``/loop``');
}
