/* eslint-disable max-statements */
/* eslint-disable no-unused-vars */
/* eslint-disable max-lines-per-function */
const {
	VoiceConnection,
	joinVoiceChannel,
	createAudioPlayer,
	NoSubscriberBehavior,
	AudioPlayer,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	entersState,
	createAudioResource,
} = require('@discordjs/voice');
const {
	Client,
	VoiceChannel,
	TextBasedChannels,
	MessageEmbed,
} = require('discord.js');
const ytService = require('../util/ytService');
const Playlist = require('./Playlist');
const embedBuilder = require('../util/embed');
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

		let _playlist = new Playlist();

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
				adapterCreator: voiceChannel.guild.voiceAdapterCreator,
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
				behaviors: NoSubscriberBehavior.Stop,
			});

			this._createPlayerStatus();
			this._createConnectionStatus();
		};

		this._createPlayerStatus = function () {
			_player.on('error', (error) => {
				console.error(
					'Error: ',
					error.message,
					'with track',
					error.resource.metadata.title
				);
			});

			_player.on(AudioPlayerStatus.Playing, (music) => {
				const emb = embedBuilder.messageEmbed.nowPlaying(
					_hexColor,
					'Tocando agora',
					music.resource.metadata.thumbnail,
					`*[${music.resource.metadata.title}](${music.resource.metadata.url})*`
				);

				_textChannel.send({ embeds: [emb] });

				_playing = true;
				_buffering = false;
			});

			_player.on(AudioPlayerStatus.Idle, () => {
				_playing = false;
				const { loopEnabled, loopFullPlaylist } = _playlist.getLoopStatus();
				console.log('#########TESTE', loopEnabled, loopFullPlaylist);

				if (_playlist.getPlaylistIndex() >= _playlist.getPlaylistLength()) {
					if (loopEnabled && loopFullPlaylist) {
						_playlist.setPlaylistIndex(1);
						this.musicSystem.play();
					} else if (loopEnabled && !loopFullPlaylist) {
						_playlist.incrementLoopCount();
						this.musicSystem.play();
					} else {
						_playlist.clearPlaylist(1);
					}
				} else if (loopEnabled && !loopFullPlaylist) {
					this.musicSystem.play();
				} else {
					_playlist.incrementPlayerIndex();
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
						_connection.rejoin();
						// _connection.destroy();
					} catch (err) {
						console.log('ERROR ON DISCONECT');
					}
				}
			});

			_connection.on(VoiceConnectionStatus.Destroyed, async () => {
				console.log('Connection destroyed');
			});
		};

		this.musicSystem = {
			play: function async() {
				if (_playing === true) {
					return;
				}

				let song = _playlist.getSongs()[_playlist.getPlaylistIndex() - 1];

				console.log('@musicSystem: song: ', song);

				if (song && song.getTitle() === song.getUrl()) {
					ytService.searchSongByName(song.getTitle(), song.getType()).then((n) => {
						song = n;
						this._startMusic(n);
					});
				} else if (song && song.getTitle() !== song.getUrl()) {
					this._startMusic(song);
				} else {
					// serverQueue.client.queue.delete(serverQueue.guildId);
				}
			},

			_startMusic: function (song) {
				_buffering = true;
				const bufferingMsg = _textChannel.send('*Processando...*');

				_internalSongProperties = ytService.getInternalSongProperties(
					song.getLive()
				);

				console.log('@_startMusic: song: ', song);
				console.log(
					'@_startMusic: _internalSongProperties: ',
					_internalSongProperties
				);

				const stream = ytdl(song.getUrl(), {
					filter: _internalSongProperties.filter,
					quality: _internalSongProperties.quality,
					liveBuffer: 0,
					begin: '0s',
					highWaterMark: 1 << 25,
				}).once('error', (err) => {
					console.log('ytdl ERROR', err);
				});

				_connection.subscribe(_player);

				setTimeout(() => {
					const resource = createAudioResource(stream, {
						metadata: {
							title: song.getTitle(),
							url: song.getUrl(),
							author: song.getAuthor(),
							thumbnail: song.getLastThumbnailUrl(),
							loopCount: _playlist.getLoopCount(),
						},
					});

					_player.play(resource);
					bufferingMsg.then((msg) => msg.delete());
				}, 1500);
			},

			skip: function () {
				_player.stop();
			},

			prev: function () {
				_playlist.previous();
				_player.stop();
			},

			pause: function () {
				_player.pause();
			},

			resume: function () {
				_player.unpause();
			},

			stop: function () {
				_playlist.clearPlaylist();
				_player.stop();
				_connection.disconnect();
				_connection.destroy();
			},

			clear: function () {
				_playlist.clearPlaylist();
				_player.stop();
			},

			setLoop: function (enableLoop, loopType) {
				_playlist.setLoopStatus(enableLoop, loopType);
			},
		};

		this.getPlayer = function () {
			return _player;
		};

		this.setPlaylist = function (playlist) {
			_playlist = playlist;
		};

		this.addSong = (url, interaction, type = 'video') => {
			ytService.getYtSong(url, type).then((res) => {
				if (res.length > 1) {
					_playlist.addSongs(res);
					_playlist.setPlaylistTitle(res[0].plTitle);

					const emb = embedBuilder.messageEmbed.songAdd(
						_hexColor,
						`Playlist ${_playlist.getPlaylistTitle()}`,
						interaction.user.username,
						`Foram adicionadas **${res.length}** músicas à lista de REPRODUÇÃO`
					);

					_textChannel.send({ embeds: [emb] });
					this.musicSystem.play();
				} else {
					_playlist.addSong(res);
					const emb = embedBuilder.messageEmbed.songAdd(
						_hexColor,
						`**${res.title}**\nfoi adicionada à lista de REPRODUÇÃO`,
						interaction.user.username
					);

					_textChannel.send({ embeds: [emb] });
					this.musicSystem.play();
				}
			});
		};

		this.setTitle = (title) => {
			_playlist.setPlaylistTitle(title);
		};

		this.getTitle = () => {
			return _playlist.getPlaylistTitle();
		};

		this.getAllSongs = () => {
			return _playlist.getSongs();
		};

		this.getSongByIndex = (index) => {
			return _playlist.getSong(index);
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
