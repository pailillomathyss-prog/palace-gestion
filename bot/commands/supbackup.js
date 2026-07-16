const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('supbackup')
    .setDescription('Supprime tous les salons créés par la backup')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('nom')
        .setDescription('Nom du backup à supprimer (défaut: BACKUP)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const backupName = interaction.options.getString('nom') || 'BACKUP';

    const channels = await guild.channels.fetch();

    // Trouver toutes les catégories backup correspondantes
    const backupCats = channels.filter(
      c => c.type === ChannelType.GuildCategory &&
           c.name.toLowerCase().includes(backupName.toLowerCase())
    );

    if (backupCats.size === 0) {
      return interaction.editReply({
        content: `❌ Aucune catégorie de backup trouvée avec le nom **${backupName}**.`,
      });
    }

    let deleted = 0;
    let errors = 0;

    for (const [, cat] of backupCats) {
      // Supprimer tous les salons dans cette catégorie
      const children = channels.filter(c => c.parentId === cat.id);
      for (const [, ch] of children) {
        const ok = await ch.delete().catch(() => null);
        ok ? deleted++ : errors++;
      }
      // Supprimer la catégorie elle-même
      const ok = await cat.delete().catch(() => null);
      ok ? deleted++ : errors++;
    }

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Backup supprimée !')
      .setColor('#FF4444')
      .addFields(
        { name: '✅ Salons supprimés', value: `${deleted}`, inline: true },
        { name: '❌ Erreurs', value: `${errors}`, inline: true },
        { name: '📁 Backup ciblée', value: backupName, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
