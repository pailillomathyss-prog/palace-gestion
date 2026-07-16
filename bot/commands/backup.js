const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Crée une copie de tous les salons du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('nom')
        .setDescription('Nom du groupe de backup (défaut: BACKUP)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const backupName = interaction.options.getString('nom') || 'BACKUP';

    // Récupérer tous les channels
    const channels = await guild.channels.fetch();

    // Trier : catégories d'abord, puis les autres
    const categories = channels.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
    const textChannels = channels.filter(c => c.type === ChannelType.GuildText).sort((a, b) => a.position - b.position);
    const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).sort((a, b) => a.position - b.position);
    const forumChannels = channels.filter(c => c.type === ChannelType.GuildForum).sort((a, b) => a.position - b.position);

    // Map ancienID → nouveau channel
    const categoryMap = new Map();

    let created = 0;
    let errors = 0;

    // 1. Créer la catégorie racine du backup
    const rootCategory = await guild.channels.create({
      name: `📦 ${backupName}`,
      type: ChannelType.GuildCategory,
    }).catch(() => null);

    // 2. Copier les catégories existantes
    for (const [, cat] of categories) {
      const newCat = await guild.channels.create({
        name: cat.name,
        type: ChannelType.GuildCategory,
      }).catch(() => null);

      if (newCat) {
        categoryMap.set(cat.id, newCat.id);
        created++;
      } else {
        errors++;
      }
    }

    // 3. Copier les salons texte
    for (const [, ch] of textChannels) {
      const parentId = ch.parentId ? categoryMap.get(ch.parentId) : rootCategory?.id;
      await guild.channels.create({
        name: ch.name,
        type: ChannelType.GuildText,
        topic: ch.topic || null,
        nsfw: ch.nsfw,
        rateLimitPerUser: ch.rateLimitPerUser,
        parent: parentId || rootCategory?.id || null,
      }).catch(() => { errors++; return null; });
      created++;
    }

    // 4. Copier les salons vocaux
    for (const [, ch] of voiceChannels) {
      const parentId = ch.parentId ? categoryMap.get(ch.parentId) : rootCategory?.id;
      await guild.channels.create({
        name: ch.name,
        type: ChannelType.GuildVoice,
        bitrate: ch.bitrate,
        userLimit: ch.userLimit,
        parent: parentId || rootCategory?.id || null,
      }).catch(() => { errors++; return null; });
      created++;
    }

    // 5. Copier les forums
    for (const [, ch] of forumChannels) {
      const parentId = ch.parentId ? categoryMap.get(ch.parentId) : rootCategory?.id;
      await guild.channels.create({
        name: ch.name,
        type: ChannelType.GuildForum,
        parent: parentId || rootCategory?.id || null,
      }).catch(() => { errors++; return null; });
      created++;
    }

    const embed = new EmbedBuilder()
      .setTitle('📦 Backup terminé !')
      .setColor('#00FF7F')
      .addFields(
        { name: '✅ Salons copiés', value: `${created}`, inline: true },
        { name: '❌ Erreurs', value: `${errors}`, inline: true },
        { name: '📁 Nom du backup', value: backupName, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
