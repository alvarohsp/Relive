const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Retorna informações sobre o servidor!')
		.addStringOption((opt) =>
			opt
				.setName('info')
				.setRequired(true)
				.setDescription('Informações do servidor')
				.addChoices(
					{ name: 'Nome', value: 'name' },
					{ name: 'Total de membros', value: 'memberCount' }
				)
		),
	async execute(interaction) {
		if (interaction.options.get('info').value === 'name') {
			await interaction.reply({ content: interaction.guild.name });
		} else if (interaction.options.get('info').value === 'memberCount')
			await interaction.reply({
				content: `${interaction.guild.memberCount} membros`,
			});
	},
};
