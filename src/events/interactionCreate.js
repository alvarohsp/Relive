module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {

        if (!interaction.isCommand()) return;
        
        let command = undefined;
        try {
            command = interaction.client.commands.get(interaction.commandName);
        
        } catch (err) {
            await interaction.reply({ content: 'Comando inexistente!', ephemeral: true});
        
        }
        if (!command) return;
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Erro ao executar comando!', ephemeral: true });
        }

    }
};