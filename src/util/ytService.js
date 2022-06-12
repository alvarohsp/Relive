/* eslint-disable no-unused-vars */
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytSearch = require('yt-search');
const Song = require('../../entity/Song');

let newSong;
let newUrl;
let newType;

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

module.exports = {
	/**
	 *
	 * @param {string} url
	 * @param {string} type
	 * @returns {Song}
	 */
	getYtSong: async (url, type) => {
		console.log('url', url);
		console.log('type', type);
		newUrl = url;
		newType = type;

		newSong = undefined;

		if (isAValidYtLink()) {
			await replaceUrl();
			await searchSong();
			console.log('ITS A VALID YT SONG');
		} else {
			newSong = {
				title: newUrl,
				url: newUrl,
				type: newType,
			};
			console.log('NOT A VALID YT SONG');
		}

		return newSong;
	},

	searchSongByName: async (song, songType) => {
		const { videos, live } = await ytSearch({ query: song, pages: 1 });

		if (songType === 'live') {
			return ytGetSeachLive(live);
		}

		if (!videos.length) return;

		const songInfo = await ytdl.getBasicInfo(videos[0].url);

		newSong = {
			title: songInfo.videoDetails.title,
			author: songInfo.videoDetails.author.name,
			url: songInfo.videoDetails.video_url,
			live: songInfo.videoDetails.isLiveContent,
			chapters: songInfo.videoDetails.chapters,
			thumbnails: songInfo.videoDetails.thumbnails,
		};

		return new Song(newSong);
	},
	getInternalSongProperties: (bool) => {
		const prop = {
			filter: 'audioonly',
			quality: 'highestaudio',
		};

		if (bool) {
			prop.filter = 'audio';
			prop.quality = 'lowestaudio';
		}
		return prop;
	},
};

function isAValidYtLink() {
	return ytdl.validateURL(newUrl);
}

async function replaceUrl() {
	const url = newUrl;

	if (url.match(/^https?:\/\/(youtu.be)\/(.*)$/)) {
		newUrl = url.replace(
			/^https?:\/\/(youtu.be)\//,
			'https://www.youtube.com/watch?v='
		);
		newUrl = newUrl.replace(/(\?list)/, '&list');
	}
}

async function ytGetSeachLive(live) {
	if (live.length) {
		const songInfo = await ytdl.getBasicInfo(live[0].url);

		newSong = {
			title: songInfo.videoDetails.title,
			author: songInfo.videoDetails.author.name,
			url: songInfo.videoDetails.video_url,
			live: songInfo.videoDetails.isLiveContent,
			chapters: songInfo.videoDetails.chapters,
			thumbnails: songInfo.videoDetails.thumbnails,
		};
		return newSong;
	}
}

async function searchSong() {
	try {
		console.log('##PLAYLIST');
		console.log(newUrl);
		const playlistId = await ytpl.getPlaylistID(newUrl);
		const playlist = await ytpl(playlistId, { limit: Infinity });
		newSong = [];

		playlist.items.forEach((element) => {
			newSong.push({
				plTitle: playlist.title,
				title: element.title,
				url: element.shortUrl,
				thumbnails: element.thumbnails,
			});
		});
	} catch {
		console.log('##SINGLE VIDEO');

		const songInfo = await ytdl.getBasicInfo(newUrl);

		newSong = {
			title: songInfo.videoDetails.title,
			author: songInfo.videoDetails.author.name,
			url: songInfo.videoDetails.video_url,
			live: songInfo.videoDetails.isLiveContent,
			chapters: songInfo.videoDetails.chapters,
			thumbnails: songInfo.videoDetails.thumbnails,
		};
	}
}
