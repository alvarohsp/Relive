/* eslint-disable no-unused-vars */
// const ytService = require('../src/util/ytService');

/**
* @typedef Song
* @type {object}
* @property {string} title
* @property {string} url
* @property {string} author
* @property {boolean} live
* @property {any} chapters
* @property {any} thumbnails
*/

module.exports = class Playlist {

    // eslint-disable-next-line max-lines-per-function
    constructor() {
        /** @type {string} */
        let _playlistTitle;

        /** @type {Song[]} */
        let _songs = [];

        /** @type {number} */
        let _playerIndex = 1;

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

        this.clearPlaylist = function () {
            _songs = [];
            _playerIndex = 1;
        };

        this.addSong = function (song) {
            _songs.push(song);
        };

        this.addSongs = function (song) {
            _songs.push(...song);
        };

        this.getSongs = function () {
            return _songs;
        };

        this.getSongByIndex = function (index) {
            return _songs[index];
        };

        this.getSong = function () {
            return _songs[_playerIndex - 1];
        };

        this.setPlayerIndex = function (index) {
            _playerIndex = index;
        };

        this.incrementPlayerIndex = function () {
            _playerIndex ++;
        };

        this.decrementPlayerIndex = function () {
            _playerIndex --;
        };

        this.getPlayerIndex = function () {
            return _playerIndex;
        };

    }

};

