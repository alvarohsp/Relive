/* eslint-disable no-unused-vars */
// const ytService = require('../src/util/ytService');
const Song = require('./Song');

module.exports = class Playlist {
	// eslint-disable-next-line max-lines-per-function
	constructor() {
		/** @type {string} */
		let _playlistTitle;

		/** @type {Song[]} */
		let _songs = [];

		/** @type {number} */
		let _playlistIndex = 1;

		/** @type {boolean} */
		let _loopEnabled = false;

		/** @type {number} */
		let _loopCount = 0;

		/** @type {boolean} */
		let _loopFullPlaylist = false;

		/**
		 * @param {string} title
		 */
		this.setPlaylistTitle = function (title) {
			_playlistTitle = title;
		};

		this.getPlaylistTitle = function () {
			return _playlistTitle;
		};

		this.setSongs = function (song) {
			_songs = song;
		};

		this.clearPlaylist = function (index = 0) {
			_songs = [];
			_playlistIndex = index;
			_loopCount = 0;
		};

		this.addSong = function (song) {
			_songs.push(new Song(song));
		};

		this.addSongs = function (songs) {
			songs.forEach((song) => {
				_songs.push(new Song(song));
			});
		};

		this.getSongs = () => {
			return _songs;
		};

		this.getSongByIndex = (index) => {
			return _songs[index];
		};

		this.getSong = () => {
			return _songs[_playlistIndex - 1];
		};

		this.getPlaylistLength = () => {
			return _songs.length;
		};

		this.setPlaylistIndex = (index) => {
			_playlistIndex = index;
		};

		this.incrementPlayerIndex = (number = 1) => {
			_playlistIndex += number;
		};

		this.decrementPlayerIndex = (number = 1) => {
			_playlistIndex -= number;
		};

		this.getPlaylistIndex = () => {
			return _playlistIndex;
		};

		this.enableLoop = () => {
			_loopEnabled = true;
		};

		this.disableLoop = () => {
			_loopEnabled = false;
		};

		this.getLoopStatus = () => {
			return _loopEnabled;
		};

		this.setLoopCount = (count) => {
			_loopCount = count;
		};

		this.getLoopCount = () => {
			return _loopCount;
		};

		this.setLoopStatus = (enableLoop, loopType) => {
			_loopEnabled = enableLoop === true ? true : false;
			_loopFullPlaylist = loopType === 'playlist' ? true : false;
		};

		this.getLoopStatus = () => {
			return {
				loopEnabled: _loopEnabled,
				loopFullPlaylist: _loopFullPlaylist,
			};
		};

		this.setLoopCount = (count) => {
			_loopCount = count;
		};

		this.getLoopCount = () => {
			return _loopCount;
		};

		this.incrementLoopCount = (number = 1) => {
			_loopCount += number;
		};

		this.previous = () => {
			if (_songs.length <= 0) {
				return;
			}

			if (_playlistIndex === 1) {
				_playlistIndex -= 1;
			} else if (_playlistIndex >= 2) {
				_playlistIndex -= 2;
			}
		};
	}
};
