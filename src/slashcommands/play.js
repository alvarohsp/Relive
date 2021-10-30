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
// const fs = require('fs');

const embedBuilder = require('../util/embed');

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

    });

    player.on(AudioPlayerStatus.Playing, () => {
        // serverQueue.textChannel.send({ content: `Tocando agora: ${serverQueue.songs[0].title}` });
        const emb = embedBuilder.messageEmbed.nowPlaying(serverQueue.hexColor,
            'Tocando agora',
            serverQueue.songs[0].thumbnails[serverQueue.songs[0].thumbnails.length - 1].url,
            `*${serverQueue.songs[0].title}*`);

        serverQueue.textChannel.send({ embeds: [emb] });

        serverQueue.playing = true;
        serverQueue.buffering = false;
        client.queue.set(guildId, serverQueue);
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
        console.log('Connection lost');
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 2_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 2_000),
            ]);

        } catch (error) {
            console.log('DISCONECTED', error);
            try {
                serverQueue.connection.destroy();
            } catch (err) {
                console.log('ERROR ON DISCONECT');
            }
        }
    });

    connection.on(VoiceConnectionStatus.Destroyed, async () => {
        console.log('Connection destroyed');
        try {
            await client.queue.delete(guildId);
        } catch (error) {
            console.log(error);
        }
    });
}

async function ytGetPlaylistSongs(url) {

    const playlistId = await ytpl.getPlaylistID(url);
    const playlist = await ytpl(playlistId, { limit: Infinity });

    const songs = [];

    playlist.items.forEach((element) => {

        // songs.push({ title: element.title, url: element.shortUrl });
        songs.push({
            title: element.title,
            url: element.shortUrl,
            thumbnails: element.thumbnails,

        });

    });

    return songs;
}

async function songConstructor(songInfo) {
    const song = {
        title: songInfo.videoDetails.title,
        author: songInfo.videoDetails.author.name,
        url: songInfo.videoDetails.video_url,
        live: songInfo.videoDetails.isLiveContent,
        chapters: songInfo.videoDetails.chapters,
        thumbnails: songInfo.videoDetails.thumbnails
    };
    return song;
}

async function ytGetSeachLive(live) {

    if (live.length) {

        const songInfo = await ytdl.getBasicInfo(live[0].url);
        const song = await songConstructor(songInfo);

        return song;
    }
}

async function ytGetSearchSong(url, songType) {

    const { videos, live } = await ytSearch({ query: url, pages: 1 });

    if (songType === 'live') {
        return ytGetSeachLive(live);
    }

    if (!videos.length) return;

    const songInfo = await ytdl.getBasicInfo(videos[0].url);
    const song = await songConstructor(songInfo);

    return song;
}

async function ytGetSearchSongPre(songTitle, songType) {

    const song = {
        title: songTitle,
        url: songTitle,
        songType: songType
    };

    return song;
}

async function ytGetSong(url) {

    const songInfo = await ytdl.getBasicInfo(url);
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
        song = await ytGetSearchSongPre(url, songType);
    }

    return song;
}

/**
 * Função dedicada a ajustar a string de URL de forma que
 * o bot consiga buscar o link corretamente.
 * 
 * @param {string} url 
 * @returns {string}
 */
async function ytUrlReplace(url) {

    let newUrl;

    if (url.match(/^https?:\/\/(youtu.be)\/(.*)$/)) {
        newUrl = await url.replace(/^https?:\/\/(youtu.be)\//, 'https://www.youtube.com/watch?v=');
        newUrl = await newUrl.replace(/(\?list)/, '&list');
    }

    return newUrl;
}

/**
 * Função dedicada a verificar qual o tipo da entrada do usuário.
 * 
 * Recebe a entrada do usuário {string} como parametro e retorna 0 se a entrada informada for
 * um link do youtube válido, e retorna 1 caso contrário
 * 
 * @param {string} url 
 * @returns {number}
 */
async function verificarLink(url) {

    if (ytdl.validateURL(url)) {
        return 0;
    }
    return 1;

}

/**
 * Função destinada a construir a queue.
 * 
 * Recebe a interação e o canal de voz como parametro e retorna a queue construida.
 * 
 * @param {interaction} interaction 
 * @param {voiceChannel} voiceChannel 
 * @returns queueConstruct
 */

async function queueConstructor(interaction, voiceChannel) {

    const queueConstruct = {
        connection: await createConnection(voiceChannel),
        client: interaction.client,
        guildId: interaction.guild.id,
        textChannel: await interaction.channel,
        player: await createPlayer(),
        playlistTitle: '',
        songs: [],
        playing: true,
        buffering: false,
        hexColor: interaction.guild.me.displayHexColor
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

    if (serverQueue.playing === false) {
        const updatedServerQueue = await interaction.client.queue.get(interaction.guild.id);
        return playSong(updatedServerQueue, interaction.client, interaction.guild.id);
    }
}

async function endOfPlayCommand(queueConstruct, songs, interaction) {

    await addSongToQueue(queueConstruct, songs, interaction);
    await interaction.editReply('⏯️ ``/play``');
}

function addSongToQueue(queueConstruct, newSongs, interaction) {

    if (newSongs.length > 1) {
        queueConstruct.songs.push(...newSongs);
        const emb = embedBuilder.messageEmbed.songAdd(queueConstruct.hexColor,
            `Foram adicionadas **${newSongs.length}** músicas à lista de reprodução`,
            interaction.user.username);

        queueConstruct.textChannel.send({ embeds: [emb] });

    } else {
        queueConstruct.songs.push(newSongs);
        const emb = embedBuilder.messageEmbed.songAdd(queueConstruct.hexColor,
            `**${newSongs.title}**\nfoi adicionada à lista de reprodução`,
            interaction.user.username);

        queueConstruct.textChannel.send({ embeds: [emb] });

    }

    // console.log(queueConstruct.songs);
    return interaction.client.queue.set(interaction.guild.id, queueConstruct);
}

async function playSong(serverQueue, client, guildId) {
    serverQueue.buffering = true;

    let song = serverQueue.songs[0];

    if (song) {

        if (song.title === song.url) {

            song = await ytGetSearchSong(song.url, song.songType);

            serverQueue.songs[0] = song;
            client.queue.set(guildId, serverQueue);

        }
        let songFilter = 'audioonly';
        let songQuality = 'highestaudio';

        if (song.live === true) {
            songFilter = 'audio';
            songQuality = 'lowestaudio';
        }

        // console.log(song);
        // console.log(songFilter);

        const stream = ytdl(song.url, { filter: songFilter, quality: songQuality, liveBuffer: 0, highWaterMark: 1 << 25, begin: '0s' });
        // .once('close', () => {
        //     console.log('ON CLOSE');
        // })
        // .once('data', () => {
        //     console.log('ON DATA');
        // })
        // .once('end', () => {
        //     console.log('ONCE END');
        // })
        // .once('error', (qwe) => {
        //     console.log('ONCE ERROR', qwe);
        // })
        // .once('pause', () => {
        //     console.log('ON PAUSE');
        // })
        // .once('readable', () => {
        //     console.log('ON READABLE');
        // })
        // .once('resume', () => {
        //     console.log('ON RESUME');
        // });

        // const stream = ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25, begin: '0s' })
        // .pipe(fs.createWriteStream('./stream.mp3'));

        const bufferingMsg = serverQueue.textChannel.send('*Processando...*');

        // stream.on('finish', () => {

        //     const streamFile = fs.createReadStream('./stream.mp3');

        //     const resource = createAudioResource(streamFile, {
        //         metadata: {
        //             title: song.title
        //         }
        //     });
        //     serverQueue.connection.subscribe(serverQueue.player);
        //     serverQueue.player.play(resource);

        // });

        // stream.on('error', (err) => {
        //     console.log('ytdl error: ', err);
        // });

        setTimeout(() => {

            const resource = createAudioResource(stream, {
                metadata: {
                    title: song.title
                }
            });
            serverQueue.connection.subscribe(serverQueue.player);
            serverQueue.player.play(resource);
            bufferingMsg.then((msg) => msg.delete());

        }, 3000);

    } else {
        serverQueue.client.queue.delete(serverQueue.guildId);
    }
}
