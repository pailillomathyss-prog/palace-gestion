const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restaurer')
    .setDescription('Recolle une backup — recrée tous les salons sauvegardés')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('nom')
        .setDescription('Nom du backup à restaurer (ex: BACKUP)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const backupName = interaction.options.getString('nom') || 'BACKUP';

    // Trouver la catégorie racine du backup
    const channels = await guild.channels.fetch();
    const rootCat = channels.find(
      c => c.type === ChannelType.GuildCategory &&
           c.name.toLowerCase().includes(backupName.toLowerCase())
    );

    if (!rootCat) {
      return interaction.editReply({
        content: `❌ Aucune catégorie de backup trouvée avec le nom **${backupName}**.\nFais d'abord \`/backup\` pour créer une sauvegarde.`,
      });
    }

    // Récupérer tous les salons dans cette catégorie de backup
    const backupChannels = channels
      .filter(c => c.parentId === rootCat.id)
      .sort((a, b) => a.position - b.position);

    if (backupChannels.size === 0) {
      return interaction.editReply({ content: `❌ Aucun salon trouvé dans la catégorie **${rootCat.name}**.` });
    }

    // Créer une nouvelle catégorie "RESTAURÉ"
    const restoreCategory = await guild.channels.create({
      name: `♻️ RESTAURÉ — ${backupName}`,
      type: ChannelType.GuildCategory,
    }).catch(() => null);

    let created = 0;
    let errors = 0;

    for (const [, ch] of backupChannels) {
      if (ch.type === ChannelType.GuildText) {
        const newCh = await guild.channels.create({
          name: ch.name,
          type: ChannelType.GuildText,
          topic: ch.topic || null,
          nsfw: ch.nsfw,
          rateLimitPerUser: ch.rateLimitPerUser,
          parent: restoreCategory?.id || null,
        }).catch(() => null);
        newCh ? created++ : errors++;
      } else if (ch.type === ChannelType.GuildVoice) {
        const newCh = await guild.channels.create({
          name: ch.name,
          type: ChannelType.GuildVoice,
          bitrate: ch.bitrate,
          userLimit: ch.userLimit,
          parent: restoreCategory?.id || null,
        }).catch(() => null);
        newCh ? created++ : errors++;
      } else if (ch.type === ChannelType.GuildForum) {
        const newCh = await guild.channels.create({
          name: ch.name,
          type: ChannelType.GuildForum,
          parent: restoreCategory?.id || null,
        }).catch(() => null);
        newCh ? created++ : errors++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('♻️ Restauration terminée !')
      .setColor('#5865F2')
      .addFields(
        { name: '✅ Salons restaurés', value: `${created}`, inline: true },
        { name: '❌ Erreurs', value: `${errors}`, inline: true },
        { name: '📁 Backup utilisé', value: rootCat.name, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
