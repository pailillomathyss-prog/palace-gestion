const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const config = require('../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configurer le bot pour ce serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('role_premium')
        .setDescription('Définir le rôle attribué aux membres premium acceptés')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Le rôle premium à attribuer')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('salon_tickets')
        .setDescription('Définir la catégorie où créer les tickets')
        .addChannelOption(opt =>
          opt.setName('categorie')
            .setDescription('La catégorie pour les tickets premium')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('message_refus')
        .setDescription('Personnaliser le message MP envoyé en cas de refus')
        .addStringOption(opt =>
          opt.setName('message')
            .setDescription('Message envoyé à l\'utilisateur refusé (utilise {user} pour mentionner)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('voir')
        .setDescription('Voir la configuration actuelle')
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'role_premium') {
      const role = interaction.options.getRole('role');
      config.set(guildId, 'premiumRoleId', role.id);
      await interaction.editReply({ content: `✅ Rôle premium configuré : ${role}` });

    } else if (sub === 'salon_tickets') {
      const categorie = interaction.options.getChannel('categorie');
      config.set(guildId, 'ticketCategoryId', categorie.id);
      await interaction.editReply({ content: `✅ Catégorie tickets configurée : **${categorie.name}**` });

    } else if (sub === 'message_refus') {
      const message = interaction.options.getString('message');
      config.set(guildId, 'refusMessage', message);
      await interaction.editReply({ content: `✅ Message de refus configuré :\n> ${message}` });

    } else if (sub === 'voir') {
      const roleId = config.get(guildId, 'premiumRoleId');
      const catId = config.get(guildId, 'ticketCategoryId');
      const refusMsg = config.get(guildId, 'refusMessage');

      const embed = new EmbedBuilder()
        .setTitle('⚙️ Configuration actuelle')
        .setColor('#5865F2')
        .addFields(
          { name: '💎 Rôle premium', value: roleId ? `<@&${roleId}>` : '*Non configuré*', inline: true },
          { name: '🎫 Catégorie tickets', value: catId ? `<#${catId}>` : '*Non configurée*', inline: true },
          { name: '❌ Message de refus', value: refusMsg || '*Message par défaut*', inline: false },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
