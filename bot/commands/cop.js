const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cop')
    .setDescription('Remet tous les salons copiés — supprime les actuels et restaure la backup')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('nom')
        .setDescription('Nom du backup à remettre (défaut: BACKUP)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const backupName = interaction.options.getString('nom') || 'BACKUP';

    // Trouver la catégorie backup
    const channels = await guild.channels.fetch();
    const rootCat = channels.find(
      c => c.type === ChannelType.GuildCategory &&
           c.name.toLowerCase().includes(backupName.toLowerCase())
    );

    if (!rootCat) {
      return interaction.editReply({
        content: `❌ Aucune backup trouvée avec le nom **${backupName}**. Fais d'abord \`/backup\`.`,
      });
    }

    // Salons dans la backup
    const backupChannels = channels
      .filter(c => c.parentId === rootCat.id)
      .sort((a, b) => a.position - b.position);

    if (backupChannels.size === 0) {
      return interaction.editReply({ content: `❌ La backup **${rootCat.name}** est vide.` });
    }

    // Supprimer tous les salons actuels sauf la catégorie backup et ses salons
    const backupIds = new Set([rootCat.id, ...backupChannels.map((_, id) => id)]);
    const toDelete = channels.filter(c => !backupIds.has(c.id));

    for (const [, ch] of toDelete) {
      await ch.delete().catch(() => {});
    }

    // Recréer les salons depuis la backup
    let created = 0;
    let errors = 0;

    // Map des catégories backup → nouvelles catégories
    const catMap = new Map();

    // Recréer d'abord les catégories de la backup
    const backupCats = backupChannels.filter(c => c.type === ChannelType.GuildCategory);
    for (const [, cat] of backupCats) {
      const newCat = await guild.channels.create({
        name: cat.name,
        type: ChannelType.GuildCategory,
      }).catch(() => null);
      if (newCat) { catMap.set(cat.id, newCat.id); created++; } else errors++;
    }

    // Puis les salons texte/voix/forum
    for (const [, ch] of backupChannels) {
      if (ch.type === ChannelType.GuildCategory) continue;
      const parentId = ch.parentId ? catMap.get(ch.parentId) : null;

      if (ch.type === ChannelType.GuildText) {
        const r = await guild.channels.create({
          name: ch.name,
          type: ChannelType.GuildText,
          topic: ch.topic || null,
          nsfw: ch.nsfw,
          rateLimitPerUser: ch.rateLimitPerUser,
          parent: parentId || null,
        }).catch(() => null);
        r ? created++ : errors++;
      } else if (ch.type === ChannelType.GuildVoice) {
        const r = await guild.channels.create({
          name: ch.name,
          type: ChannelType.GuildVoice,
          bitrate: ch.bitrate,
          userLimit: ch.userLimit,
          parent: parentId || null,
        }).catch(() => null);
        r ? created++ : errors++;
      } else if (ch.type === ChannelType.GuildForum) {
        const r = await guild.channels.create({
          name: ch.name,
          type: ChannelType.GuildForum,
          parent: parentId || null,
        }).catch(() => null);
        r ? created++ : errors++;
      }
    }

    // Supprimer la catégorie backup maintenant qu'on a tout recréé
    await rootCat.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setTitle('♻️ Remise en place terminée !')
      .setColor('#00FF7F')
      .addFields(
        { name: '✅ Salons remis', value: `${created}`, inline: true },
        { name: '❌ Erreurs', value: `${errors}`, inline: true },
        { name: '📁 Backup utilisée', value: backupName, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
