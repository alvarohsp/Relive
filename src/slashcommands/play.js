const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction, VoiceChannel } = require('discord.js');
const ServerQueue = require('../../entity/ServerQueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduz uma música do youtube!')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Pesquise por nome ou cole um link')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tipo-da-busca')
                .setRequired(false)
                .setDescription('*Opcional* Escolha a preferência da busca')
                .addChoice('Video', 'video')
                .addChoice('Live Stream', 'live')),
    async execute(interaction) {
        await interaction.deferReply();
        await playMusic(interaction);
    }

};

// /**
//  * Função dedicada a ajustar a string de URL de forma que
//  * o bot consiga buscar o link corretamente.
//  * 
//  * @param {string} url 
//  * @returns {string}
//  */

async function playMusic(interaction) {
    const serverQueue = interaction.client.queue.get(interaction.guild.id);
    const voiceChannel = interaction.member.voice.channel;
    const url = interaction.options.getString('url');

    if (!voiceChannel) return interaction.editReply('Entre em um canal de voz');
    if (!url) return interaction.editReply('Tocar o que?');

    const musicType = interaction.options.getString('tipo-da-busca');

    await interaction.editReply('⏯️ ``/play``');

    if (!serverQueue) {

        const testQueue = new ServerQueue();

        testQueue.setClient(interaction.client);
        testQueue.setGuildId(interaction.guild.id);
        testQueue.setHexColor(interaction.guild.me.displayHexColor);
        testQueue.setTextChannel(interaction.channel);
        testQueue.setConnection(voiceChannel);
        testQueue.createPlayer();

        testQueue.playlist.addSong(url, musicType, interaction);

        setTimeout(() => {

            testQueue.musicSystem.play();

        }, 1000);

        return interaction.client.queue.set(interaction.guild.id, testQueue);
    }

    serverQueue.playlist.addSong(url, musicType, interaction);

    setTimeout(() => {

        serverQueue.musicSystem.play();

    }, 1000);

    // return interaction.client.queue.set(interaction.guild.id, serverQueue);
}