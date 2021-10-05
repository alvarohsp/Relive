const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel,
    createAudioPlayer,
    NoSubscriberBehavior,
    createAudioResource,
    AudioPlayerStatus } = require('@discordjs/voice');
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
    }

};

async function playMusic(interaction) {
    const serverQueue = interaction.client.queue.get(interaction.guild.id);
    const voiceChannel = interaction.member.voice.channel;
    const url = interaction.options.getString('url');

    if (!voiceChannel) return interaction.editReply('Entre em um canal de voz');
    if (!url) return interaction.editReply('Tocar o que?');

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

    player.on('error', error => {
        console.error('Error: ', error.message, 'with track', error.resource.metadata.title);
    });

    player.on(AudioPlayerStatus.Playing, () => {
        interaction.channel.send({content: `Tocando agora: ${song.title}` });
    });
    
    player.on(AudioPlayerStatus.Idle, () => {
        interaction.channel.send({ content: 'Idle' });
    });
    
    player.on(AudioPlayerStatus.Paused, () => {
        interaction.channel.send({ content: 'Música pausada' });
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

        if (!videos.length) return interaction.editReply('Música não encontrada!');

        const songInfo = await ytdl.getInfo(videos[0].url);
        song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            chapters: songInfo.videoDetails.chapters
        };
    }

    if (song.url) {
        const stream = ytdl(song.url, { filter: 'audio', quality: 'highestaudio', liveBuffer: 0, highWaterMark: 1 << 25 });
        const resource = createAudioResource(stream, {
            metadata: {
                title: song.title
            }
        });
        const subscription = connection.subscribe(player);
        player.play(resource);
        interaction.client.musicPlayer = player;
        // const mensagem = interaction.channel.send({content: 'Tocando agora'});
        await interaction.editReply(`Tocando agora: ${song.title}`);
        const msg = await interaction.fetchReply();
        msg.react('⏯️');

    } else {
        return interaction.editReply('Música não encontrada!');
    }

}
