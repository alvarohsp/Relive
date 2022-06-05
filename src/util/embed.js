const { MessageEmbed } = require('discord.js');
module.exports = {

    messageEmbed: {

        songAdd: (...params) => {
            const [color, title, footer] = params;
            const embed = new MessageEmbed()
            .setColor(color)
            .setTitle(title)
            .setTimestamp()
            .setFooter({text: footer});

            return embed;
        },

        nowPlaying: (...params) => {
            const [color, title, thumb, description] = params;
            const embed = new MessageEmbed()
            .setColor(color)
            .setTitle(title)
            .setDescription(description)
            .setImage(thumb)
            .setTimestamp();

            return embed;

        }

    }

};