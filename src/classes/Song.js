module.exports = class Song {
	// eslint-disable-next-line max-lines-per-function
	constructor(song) {
		/** @type {string} */
		let _title = song.title;
		/** @type {string} */
		let _url = song.url;
		/** @type {string} */
		let _author = song.author ? song.author : undefined;

		let _type = song.type ? song.type : 'video';
		let _live = song.live ? song.live : false;
		let _chapters = song.chapters ? song.chapters : [];
		let _thumbnails = song.thumbnails ? song.thumbnails : [];

		/**
		 * @param {string} title
		 */
		this.setTitle = function (title) {
			_title = title;
		};

		this.getTitle = function () {
			return _title;
		};

		/**
		 * @param {string} url
		 */
		this.setUrl = function (url) {
			_url = url;
		};

		this.getUrl = function () {
			return _url;
		};

		/**
		 * @param {string} author
		 */
		this.setAuthor = function (author) {
			_author = author;
		};

		this.getAuthor = function () {
			return _author;
		};

		/**
		 * @param {boolean} live
		 */
		this.setLive = function (live) {
			_live = live;
		};

		this.getLive = function () {
			return _live;
		};

		/**
		 * @param {string} type
		 */
		this.setType = function (type) {
			_type = type;
		};

		this.getType = function () {
			return _type;
		};

		/**
		 * @param {any} chapters
		 */
		this.setChapters = function (chapters) {
			_chapters = chapters;
		};

		this.getChapters = function () {
			return _chapters;
		};

		/**
		 * @param {any} thumbnails
		 */
		this.setThumbnails = function (thumbnails) {
			_thumbnails = thumbnails;
		};

		this.getThumbnails = function () {
			return _thumbnails;
		};

		this.getLastThumbnailUrl = function () {
			return _thumbnails[_thumbnails.length - 1].url;
		};
	}
};
