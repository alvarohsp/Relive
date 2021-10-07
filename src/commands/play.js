const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel,
    createAudioPlayer,
    NoSubscriberBehavior,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const ytpl = require('ytpl');

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

async function createPlayerStatus(client, guildId) {

    const serverQueue = client.queue.get(guildId);
    const player = serverQueue.player;
    const connection = serverQueue.connection;

    player.on('error', error => {
        console.error('Error: ', error.message, 'with track', error.resource.metadata.title);
        console.log('ERROR ON PLAYING', error);
        playSong(serverQueue, client, guildId);

    });

    player.on(AudioPlayerStatus.Playing, () => {
        serverQueue.textChannel.send({ content: `Tocando agora: ${serverQueue.songs[0].title}` });
        serverQueue.playing = true;
    });

    player.on(AudioPlayerStatus.Idle, () => {
        serverQueue.songs.shift();
        serverQueue.playing = false;
        client.queue.set(guildId, serverQueue);
        playSong(serverQueue, client, guildId);
    });

    player.on(AudioPlayerStatus.Paused, () => {
        serverQueue.textChannel.send({ content: 'Música pausada' });
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);

        } catch (error) {
            connection.destroy();
            client.queue.delete(guildId);
        }
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

async function ytGetSeachLive(live) {

    if (live.length) {

        const songInfo = await ytdl.getInfo(live[0].url);
        const song = await songConstructor(songInfo);

        return song;
    }
}

async function ytGetSearchSong(url, songType) {

    const { videos, live } = await ytSearch(url);

    if (songType === 'live') {
        return ytGetSeachLive(live);

    }

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

async function getMusic(url, songType) {

    const linkTipo = await verificarLink(url);
    let song = undefined;

    if (linkTipo === 0) {
        const urlReplaced = await ytUrlReplace(url);
        try {
            song = await ytGetPlaylistSongs(urlReplaced);
        } catch (err) {
            try {
                song = await ytGetSong(url);

            } catch (err) {
                console.log(err);
            }
        }
    } else {
        song = await ytGetSearchSong(url, songType);
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

async function queueConstructor(interaction, voiceChannel) {

    const queueConstruct = {
        connection: await createConnection(voiceChannel),
        client: interaction.client,
        guildId: interaction.guild.id,
        textChannel: await interaction.channel,
        player: await createPlayer(),
        playlistTitle: '',
        songs: [],
        playing: false
    };

    return queueConstruct;

}


async function playMusic(interaction) {
    const serverQueue = interaction.client.queue.get(interaction.guild.id);
    const voiceChannel = interaction.member.voice.channel;
    const url = interaction.options.getString('url');

    if (!voiceChannel) return interaction.editReply('Entre em um canal de voz');
    if (!url) return interaction.editReply('Tocar o que?');

    const musicType = interaction.options.getString('tipo-da-busca');
    const songs = await getMusic(url, musicType);

    if (!serverQueue) {

        const queueConstruct = await queueConstructor(interaction, voiceChannel);

        await endOfPlayCommand(queueConstruct, songs, interaction);
        
        const updatedServerQueue = interaction.client.queue.get(interaction.guild.id);
        createPlayerStatus(interaction.client, interaction.guild.id);
        return playSong(updatedServerQueue, interaction.client, interaction.guild.id);

    }

    await endOfPlayCommand(serverQueue, songs, interaction);

    console.log(serverQueue.songs);

    if (serverQueue.playing === false) {
        const updatedServerQueue = await interaction.client.queue.get(interaction.guild.id);
        return playSong(updatedServerQueue, interaction.client, interaction.guild.id);
    }
}

async function endOfPlayCommand(queueConstruct, songs, interaction) {

    await addSongToQueue(queueConstruct, songs, interaction);

    await interaction.editReply(`*${interaction.user.username}* usou o comando Play`);
    const msg = await interaction.fetchReply();
    msg.react('⏯️');

}

function addSongToQueue(queueConstruct, newSongs, interaction) {

    if (newSongs.length > 1) {
        queueConstruct.songs.push(...newSongs);
        queueConstruct.textChannel.send({ content: `Foram adicionadas ${newSongs.length} músicas à lista de reprodução` });
    } else {
        queueConstruct.songs.push(newSongs);
        queueConstruct.textChannel.send({ content: `*${newSongs.title}* Foi adicionada à lista de reprodução` });
    }

    return interaction.client.queue.set(interaction.guild.id, queueConstruct);
}

async function playSong(serverQueue) {

    const song = serverQueue.songs[0];

    if (song) {
        const stream = ytdl(song.url, { filter: 'audio', liveBuffer: 0, highWaterMark: 52000 });
        const resource = createAudioResource(stream, {
            metadata: {
                title: song.title
            }
        });
        serverQueue.connection.subscribe(serverQueue.player);
        serverQueue.player.play(resource);
    } else {
        serverQueue.client.queue.delete(serverQueue.guildId);
    }
}
