const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel,
    createAudioPlayer,
    NoSubscriberBehavior,
    createAudioResource,
    AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const ytpl = require('ytpl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play youtube music!')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Song name of URL')
                .setRequired(true)),
    async execute(interaction) {
        // await interaction.deferReply();
        await playMusic(interaction);
    }

};

async function createConnection(voiceChannel) {

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    return connection;
}

async function createPlayer() {

    const player = createAudioPlayer({
        behaviors: {
            NoSubscriber: NoSubscriberBehavior.Stop,
        }
    });

    return player;
}

async function createPlayerStatus(interaction) {

    const player = interaction.client.musicPlayer;

    player.on('error', error => {
        console.error('Error: ', error.message, 'with track', error.resource.metadata.title);
    });

    player.on(AudioPlayerStatus.Playing, () => {
        interaction.channel.send({ content: 'Tocando agora' });
    });

    player.on(AudioPlayerStatus.Idle, () => {
        interaction.channel.send({ content: 'Idle' });
    });

    player.on(AudioPlayerStatus.Paused, () => {
        interaction.channel.send({ content: 'Música pausada' });
    });
}

async function ytGetPlaylistSongs(url) {

    const playlistId = await ytpl.getPlaylistID(url);
    const playlist = await ytpl(playlistId, { limit: Infinity });

    const songs = [];

    playlist.items.forEach((element) => {

        songs.push({ title: element.title, url: element.shortUrl });

    });

    return songs;
}

async function songConstructor(songInfo) {
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url
    };
    return song;
}

async function ytGetSearchSong(url) {
    const { videos } = await ytSearch(url);

    if (!videos.length) return;

    const songInfo = await ytdl.getInfo(videos[0].url);
    const song = await songConstructor(songInfo);

    return song;
}

async function ytGetSong(url) {

    const songInfo = await ytdl.getInfo(url);
    const song = await songConstructor(songInfo);

    return song;

}

async function getMusic(url) {

    const linkTipo = await verificarLink(url);
    let song = undefined;

    if (linkTipo === 0) {
        const urlReplaced = await ytUrlReplace(url);
        try {
            song = await ytGetPlaylistSongs(urlReplaced);
        } catch (err) {
            console.log(err);
            try {
                song = await ytGetSong(url);

            } catch (err) {
                console.log(err);
            }
        }

    } else {

        song = await ytGetSearchSong(url);

    }

    return song;
}


async function ytUrlReplace(url) {

    let newUrl;

    if (url.match(/^https?:\/\/(youtu.be)\/(.*)$/)) {
        newUrl = await url.replace(/^https?:\/\/(youtu.be)\//, 'https://www.youtube.com/watch?v=');
        newUrl = await newUrl.replace(/(\?list)/, '&list');
    }

    return newUrl;
}

async function verificarLink(url) {

    if (ytdl.validateURL(url)) {
        return 0;
    }
    return 1;

}


async function playMusic(interaction) {
    const serverQueue = interaction.client.queue.get(interaction.guild.id);
    const voiceChannel = interaction.member.voice.channel;
    const url = interaction.options.getString('url');

    if (!voiceChannel) return interaction.editReply('Entre em um canal de voz');
    if (!url) return interaction.editReply('Tocar o que?');

    const songs = await getMusic(url);

    if (!serverQueue) {
        const queueConstruct = {
            connection: await createConnection(voiceChannel),
            player: await createPlayer(),
            playlistTitle: '',
            songs: []
        };

        if (songs.length > 1) {
            queueConstruct.songs.push(...songs);
            interaction.channel.send({ content: `Foram adicionadas ${songs.length} músicas à playlist` });

        } else {
            queueConstruct.songs.push(songs);

        }
        interaction.client.queue.set(interaction.guild.id, queueConstruct);

    }


    const test = await interaction.client.queue.get(interaction.guild.id);
    console.log(test);
    await interaction.deferReply();
    await interaction.editReply('...');


    // let song;

    // if (ytdl.validateURL(url)) {
    //     console.log('youtubeLink');

    //     const songInfo = await ytdl.getInfo(url);
    //     song = {
    //         title: songInfo.videoDetails.title,
    //         url: songInfo.videoDetails.video_url,
    //         chapters: songInfo.videoDetails.chapters
    //     };
    //     // console.log(songInfo);

    // } else {

    //     const { videos } = await ytSearch(url);

    //     if (!videos.length) return interaction.editReply('Música não encontrada!');

    //     const songInfo = await ytdl.getInfo(videos[0].url);
    //     song = {
    //         title: songInfo.videoDetails.title,
    //         url: songInfo.videoDetails.video_url,
    //         chapters: songInfo.videoDetails.chapters
    //     };
    // }

    if (test.songs) {
        const stream = ytdl(test.songs[0].url, { filter: 'audio', quality: 'highestaudio', liveBuffer: 0, highWaterMark: 1 << 25 });
        const resource = createAudioResource(stream, {
            metadata: {
                title: test.songs[0].title
            }
        });

        const player = test.player;
        const subscription = test.connection.subscribe(player);
        player.play(resource);

        // interaction.client.queue.set(interaction.guild.id, queueConstruct);

        // interaction.client.musicPlayer = player;

            const mensagem = interaction.channel.send({content: `Tocando agora: ${test.songs[0].title}`});
            // await interaction.editReply(`Tocando agora: ${test.title}`);
            const msg = await interaction.fetchReply();
            msg.react('⏯️');

        // } else {
        //     return interaction.editReply('Música não encontrada!');
        // }

    }
}
