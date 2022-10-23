const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction, VoiceChannel } = require('discord.js');
const ServerQueue = require('../classes/ServerQueue');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Reproduz uma música do youtube!')
		.addStringOption((option) =>
			option
				.setName('url')
				.setDescription('Pesquise por nome ou cole um link')
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('tipo-da-busca')
				.setRequired(false)
				.setDescription('*Opcional* Escolha a preferência da busca')
				.setChoices(
					{ name: 'Video', value: 'video' },
					{ name: 'Live Stream', value: 'live' }
				)
		),
	async execute(interaction) {
		await interaction.deferReply();
		await playMusic(interaction);
	},
};

async function playMusic(interaction) {
	const serverQueue = interaction.client.queue.get(interaction.guild.id);
	const voiceChannel = interaction.member.voice.channel;
	const url = interaction.options.getString('url');

	if (!voiceChannel) return interaction.editReply('Entre em um canal de voz');
	if (!url) return interaction.editReply('Tocar o que?');

	const musicType = interaction.options.getString('tipo-da-busca');

	await interaction.editReply('⏯️ ``/play``');

	if (!serverQueue) {
		const queue = new ServerQueue();

		queue.setClient(interaction.client);
		queue.setGuildId(interaction.guild.id);
		queue.setHexColor(interaction.guild.me.displayHexColor);
		queue.setTextChannel(interaction.channel);
		queue.setConnection(voiceChannel);
		queue.createPlayer();

		queue.addSong(url, interaction, musicType);

		return interaction.client.queue.set(interaction.guild.id, queue);
	}

	serverQueue.addSong(url, interaction, musicType);
}
