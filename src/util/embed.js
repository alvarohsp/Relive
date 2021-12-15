const { MessageEmbed } = require('discord.js');
module.exports = {

    messageEmbed: {

        songAdd: (color, title, footer) => {
            const embed = new MessageEmbed()
            .setColor(color)
            .setTitle(title)
            .setTimestamp()
            .setFooter(footer);

            return embed;
        },

        nowPlaying: (color, title, thumb, description) => {
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