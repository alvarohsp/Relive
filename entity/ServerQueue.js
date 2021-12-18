/* eslint-disable max-statements */
/* eslint-disable no-unused-vars */
/* eslint-disable max-lines-per-function */
const { VoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayer, AudioPlayerStatus, VoiceConnectionStatus, entersState, createAudioResource } = require('@discordjs/voice');
const { Client, VoiceChannel, TextBasedChannels } = require('discord.js');
const ytService = require('../src/util/ytService');
const Playlist = require('./Playlist');
const embedBuilder = require('../src/util/embed');
const ytdl = require('ytdl-core');

/**
 * @typedef {InternalSongProperties}
 * @type {object}
 * @property {string} filter
 * @property {string} quality
 */

module.exports = class ServerQueue {

    constructor() {
        /** @type {VoiceConnection} */
        let _connection;

        /** @type {Client} */
        let _client;

        /** @type {string} */
        let _guildId;
        /** @type {string} */
        let _textChannel;
        /** @type {AudioPlayer} */
        let _player;

        let _playlist = {
            songs: [],
            playlistIndex: 1,
            playlistTitle: ''
        };

        /** @type {boolean} */
        let _playing;
        /** @type {boolean} */
        let _buffering;
        /** @type {string} */
        let _hexColor;
        /** @type {InternalSongProperties} */
        let _internalSongProperties;

        /**
        * @param {VoiceChannel} voiceChannel
        */
        this.setConnection = function (voiceChannel) {
            _connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            });
        };

        this.getPlaylist = function () {
            return _playlist;
        };

        this.getConnection = function () {
            return _connection;
        };

        /**
         * @param {Client} client 
         */
        this.setClient = function (client) {
            _client = client;
        };

        this.getClient = function () {
            return _client;
        };

        /**
         * @param {string} guildId 
         */
        this.setGuildId = function (guildId) {
            _guildId = guildId;
        };

        this.getGuildId = function () {
            return _guildId;
        };

        /**
         * @param {TextBasedChannels} channel
         */
        this.setTextChannel = function (channel) {
            _textChannel = channel;
        };

        this.getTextChannel = function () {
            return _textChannel;
        };

        this.createPlayer = function () {
            _player = createAudioPlayer({
                behaviors: NoSubscriberBehavior.Stop
            });

            this._createPlayerStatus();
            this._createConnectionStatus();
        };

        this._createPlayerStatus = function () {

            _player.on('error', error => {
                console.error('Error: ', error.message, 'with track', error.resource.metadata.title);
            });

            _player.on(AudioPlayerStatus.Playing, (music) => {
                const emb = embedBuilder.messageEmbed.nowPlaying(_hexColor,
                    'Tocando agora',
                    music.resource.metadata.thumbnail,
                    `*[${music.resource.metadata.title}](${music.resource.metadata.url})*`);

                _textChannel.send({ embeds: [emb] });

                _playing = true;
                _buffering = false;
            });

            _player.on(AudioPlayerStatus.Idle, () => {
                _playing = false;      
                if (_playlist.playerIndex > _playlist.songs.length) {
                    _playlist.songs = [];
                    _playlist.playlistIndex = 1;
                } else {
                    _playlist.playlistIndex++;
                    this.musicSystem.play();
                }
            });

            _player.on(AudioPlayerStatus.Paused, () => {
                _textChannel.send({ content: 'Música pausada' });
            });
        };

        this._createConnectionStatus = function () {
            _connection.on(VoiceConnectionStatus.Disconnected, async () => {
                console.log('Connection lost');
                try {
                    await Promise.race([
                        entersState(_connection, VoiceConnectionStatus.Signalling, 2_000),
                        entersState(_connection, VoiceConnectionStatus.Connecting, 2_000),
                    ]);

                } catch (error) {
                    console.log('DISCONECTED', error);
                    try {
                        _connection.destroy();
                    } catch (err) {
                        console.log('ERROR ON DISCONECT');
                    }
                }
            });

            _connection.on(VoiceConnectionStatus.Destroyed, async () => {
                console.log('Connection destroyed');
                // try {
                //     connClient.queue.delete(guildId);
                // } catch (error) {
                //     console.log(error);
                // }
            });

        };

        this.musicSystem = {
            play: function async() {

                if (_playing === true) {
                    return;
                }
               
                let song = _playlist.songs[_playlist.playlistIndex - 1];

                console.log('@musicSystem: song: ', song);

                if (song && song.title === song.url) {

                    ytService.searchSongByName(song.title, song.songType)
                        .then(n => {
                            song = n;
                            this._startMusic(n);
                        });

                } else if (song && song.title !== song.url) {

                    this._startMusic(song);

                } else {
                    // serverQueue.client.queue.delete(serverQueue.guildId);
                }
            },

            _startMusic: function (song) {
                _buffering = true;
                const bufferingMsg = _textChannel.send('*Processando...*');

                _internalSongProperties = ytService.getInternalSongProperties(song.live);

                console.log('@_startMusic: song: ', song);
                console.log('@_startMusic: _internalSongProperties: ', _internalSongProperties);

                const stream = ytdl(song.url, { 
                    filter: _internalSongProperties.filter, 
                    quality: _internalSongProperties.quality, 
                    liveBuffer: 0, 
                    begin: '0s' , 
                    highWaterMark: 1 << 25
                    })
                    .once('error', (err) => {
                        console.log('ytdl ERROR', err);
                    });

                    
                _connection.subscribe(_player);

                setTimeout(() => {
                    const resource = createAudioResource(stream, {
                        metadata: {
                            title: song.title,
                            url: song.url,
                            author: song.author,
                            thumbnail: song.thumbnails[song.thumbnails.length - 1].url
                        }
                    });
    
                    _player.play(resource);
                    bufferingMsg.then((msg) => msg.delete());
                }, 1200);

            },

            skip: function () {
                _player.stop();
            },

            prev: function () {
                _playlist.playlistIndex -= 2;
                _player.stop();
            },

            pause: function () {
                _player.pause();
            },

            resume: function () {
                _player.unpause();
            },

            stop: function () {
                _playlist.songs = [];
                _player.stop();
                _connection.destroy();
            },

            clear: function () {
                _playlist.playlistIndex = 0;
                _playlist.songs = [];
                _player.stop();
            }

        };

        this.getPlayer = function () {
            return _player;
        };

        this.setPlaylist = function (playlist) {
            _playlist = playlist;

        };

        this.playlist = {
            addSong: function (url, type = 'video', interaction) {
                ytService.getYtSong(url, type)
                    .then(res => {
                        if (res.length > 1) {
                            _playlist.songs.push(...res);
                            _playlist.playlistTitle(res[0].plTitle);

                            const emb = embedBuilder.messageEmbed.songAdd(_hexColor,
                                `Foram adicionadas **${res.length}** músicas à lista de REPRODUÇÃO`,
                                interaction.user.username);

                            _textChannel.send({ embeds: [emb] });

                        } else {
                            _playlist.songs.push(res);
                            const emb = embedBuilder.messageEmbed.songAdd(_hexColor,
                                `**${res.title}**\nfoi adicionada à lista de REPRODUÇÃO`,
                                interaction.user.username);

                            _textChannel.send({ embeds: [emb] });
                        }
                    });
            },

            setTitle: function (title) {
                _playlist.setPlaylistTitle(title);
            },

            getTitle: function () {
                return _playlist.getPlaylistTitle();
            },

            getAllSongs: function () {
                return _playlist.getSongs;
            },

            getSongByIndex: function (index) {
                return _playlist.getSong(index);
            },

        };

        this.setPlaying = function (playing) {
            _playing = playing;
        };

        this.getPlaying = function () {
            return _playing;
        };

        this.setBuffering = function (buffering) {
            _buffering = buffering;
        };

        this.getBuffering = function () {
            return _buffering;
        };

        this.setHexColor = function (hexColor) {
            _hexColor = hexColor;
        };

        this.getHexColor = function () {
            return _hexColor;
        };


    }
};