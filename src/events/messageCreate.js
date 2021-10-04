const fs = require('fs');
const { Collection } = require('discord.js');
const { prefix } = require('../../config.json');
const {
    joinVoiceChannel,
    createAudioPlayer,
    NoSubscriberBehavior,
    createAudioResource
} = require('@discordjs/voice');
// const play = require('play-dl');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
    name: 'messageCreate',
    async execute(message) {

        if (!message.guild) return;
        if (!message.client.application?.owner) await message.client.application?.fetch();

        const commandBody = message.content.slice(prefix.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        if (message.content.toLowerCase() === '!deploy' && message.author.id === message.client.application?.owner.id) {
            deployCommands(message);

        }

        if (command === 'play') {
      

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play');
        if (!args.length) return message.channel.send('Play what?');

        // create a connection, joining a voice channel the message sender is in.
        // const connection = joinVoiceChannel({
        //     channelId: voiceChannel.id,
        //     guildId: voiceChannel.guild.id,
        //     adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        // });

        // const ytInfo = await play.search(args.join(' '), { limit: 1 });
        // console.log('ytInfo: ', ytInfo);

        // const stream = await play.stream(ytInfo[0].url, { quality: 'highestaudio'});
        // console.log(args);
        // const stream = await play.stream(args[0]);
        
        // const resource = createAudioResource(stream.stream, { inputType: stream.type});

        // const player = createAudioPlayer({
        //     behaviors: {
        //         NoSubscriber: NoSubscriberBehavior.Play,
        //     }
        // });

        // player.play(resource);
        // connection.subscribe(player);

        //////////////////////////////////////////////////////////////////////////////////////////////////
        //////////////////////////
        /////////////////////
        //////////////
        ///////
        //

        // create a connection, joining a voice channel the message sender is in.
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        connection.on('stateChange', (oldState, newState) => {
            console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
        });

        // create an audio player
        const player = createAudioPlayer({
            behaviors: {
                NoSubscriber: NoSubscriberBehavior.Stop,
            }
        });

        // create an audio resource from Youtube
        const videoFinder = async (query) => {
            const videoResult = await ytSearch(query);
            return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
        };

        // const video = await videoFinder(args.join(' '));
        const video = {
            url: args.join(' ')
        };
        if (video) {
            // get a readable stream
            const stream = ytdl(video.url, { filter: 'audio', liveBuffer: 0, highWaterMark: 32000});
            const resource = createAudioResource(stream);
            // const resource = createAudioResource(join(__dirname, 'test.mp3')); //////////////// This does not work

            // playing audio through subscription of an audioplayer
            // eslint-disable-next-line no-unused-vars
            const subscription = connection.subscribe(player);

            //setup player
            player.play(resource);
            message.reply(`Now Playing ${video.title}`);

            player.on('stateChange', (oldState, newState) => {
                console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
            });
        }
        else {
            message.channel.send('Video not found');
            return;
        }

    }
}
};


function deployCommands(message) {

    message.client.commands = new Collection();
    const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
    console.log(`Command Files: ${commandFiles}`);


    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        // console.log(command);

        message.guild.commands.create(
            command.data);

        message.client.commands.set(command.data.name, command);

    }
    console.log('Deployed!');

}