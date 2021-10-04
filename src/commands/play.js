const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel,
    createAudioPlayer,
    NoSubscriberBehavior,
    createAudioResource } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play youtube music!')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Song name of URL')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        await playMusic(interaction);
        await interaction.editReply('Pronto!');
    }

};

async function playMusic(interaction) {
    
    const voiceChannel = interaction.member.voice.channel;
    const url = interaction.options.getString('url');

    if (!voiceChannel) return interaction.reply('Entre em um canal de voz');
    if (!url) return interaction.reply('Tocar o que?');

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer({
        behaviors: {
            NoSubscriber: NoSubscriberBehavior.Stop,
        }
    });

    let song;

    if (ytdl.validateURL(url)) {
        console.log('youtubeLink');

        const songInfo = await ytdl.getInfo(url);
        song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            chapters: songInfo.videoDetails.chapters
        };
        // console.log(songInfo);

    } else {

        const { videos } = await ytSearch(url);

        if (!videos.length) return interaction.reply('Música não encontrada!');

        const songInfo = await ytdl.getInfo(videos[0].url);
        song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            chapters: songInfo.videoDetails.chapters
        };
    }

    if (song.url) {
        const stream = ytdl(song.url, { filter: 'audio', quality: 'highestaudio', liveBuffer: 0, highWaterMark: 32000 });
        const resource = createAudioResource(stream);
        const subscription = connection.subscribe(player);
        player.play(resource);

    } else {
        interaction.reply('Música não encontrada!');
        return;
    }

}
        