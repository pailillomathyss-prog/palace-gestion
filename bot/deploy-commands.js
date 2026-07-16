require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Déploiement de ${commands.length} commandes...`);

    const guildId = process.env.GUILD_ID;
    if (guildId) {
      // Déploiement sur un serveur spécifique (instantané)
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
        { body: commands }
      );
      console.log(`✅ Commandes déployées sur le serveur ${guildId}`);
    } else {
      // Déploiement global (peut prendre jusqu'à 1h)
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Commandes déployées globalement');
    }
  } catch (error) {
    console.error('❌ Erreur lors du déploiement :', error);
  }
})();
