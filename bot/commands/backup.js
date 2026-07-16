const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Copie tous les salons de ce serveur vers un autre serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('serveur_id')
        .setDescription('ID du serveur de destination (le bot doit y être présent)')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const targetId = interaction.options.getString('serveur_id');
    const sourceGuild = interaction.guild;

    // Vérifier que le bot est dans le serveur cible
    const targetGuild = client.guilds.cache.get(targetId);
    if (!targetGuild) {
      return interaction.editReply({
        content: `❌ Le bot n'est pas présent sur le serveur \`${targetId}\`.\nInvite d'abord le bot sur ce serveur.`,
      });
    }

    if (targetGuild.id === sourceGuild.id) {
      return interaction.editReply({ content: '❌ Le serveur de destination doit être différent de ce serveur.' });
    }

    await interaction.editReply({ content: `⏳ Copie en cours vers **${targetGuild.name}**...` });

    // Récupérer tous les channels source triés par position
    const channels = await sourceGuild.channels.fetch();

    const categories  = channels.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
    const texts       = channels.filter(c => c.type === ChannelType.GuildText).sort((a, b) => a.position - b.position);
    const voices      = channels.filter(c => c.type === ChannelType.GuildVoice).sort((a, b) => a.position - b.position);
    const forums      = channels.filter(c => c.type === ChannelType.GuildForum).sort((a, b) => a.position - b.position);

    const catMap = new Map(); // ancienId → nouveauId
    let created = 0;
    let errors  = 0;

    // 1. Copier les catégories
    for (const [, cat] of categories) {
      const newCat = await targetGuild.channels.create({
        name: cat.name,
        type: ChannelType.GuildCategory,
      }).catch(() => null);

      if (newCat) { catMap.set(cat.id, newCat.id); created++; }
      else errors++;
    }

    // 2. Copier les salons texte
    for (const [, ch] of texts) {
      const parentId = ch.parentId ? catMap.get(ch.parentId) : null;
      const r = await targetGuild.channels.create({
        name: ch.name,
        type: ChannelType.GuildText,
        topic: ch.topic || null,
        nsfw: ch.nsfw,
        rateLimitPerUser: ch.rateLimitPerUser,
        parent: parentId || null,
      }).catch(() => null);
      r ? created++ : errors++;
    }

    // 3. Copier les salons vocaux
    for (const [, ch] of voices) {
      const parentId = ch.parentId ? catMap.get(ch.parentId) : null;
      const r = await targetGuild.channels.create({
        name: ch.name,
        type: ChannelType.GuildVoice,
        bitrate: Math.min(ch.bitrate, 96000),
        userLimit: ch.userLimit,
        parent: parentId || null,
      }).catch(() => null);
      r ? created++ : errors++;
    }

    // 4. Copier les forums
    for (const [, ch] of forums) {
      const parentId = ch.parentId ? catMap.get(ch.parentId) : null;
      const r = await targetGuild.channels.create({
        name: ch.name,
        type: ChannelType.GuildForum,
        parent: parentId || null,
      }).catch(() => null);
      r ? created++ : errors++;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Copie terminée !')
      .setColor('#00FF7F')
      .addFields(
        { name: '📤 Serveur source',      value: sourceGuild.name,  inline: true },
        { name: '📥 Serveur destination', value: targetGuild.name,  inline: true },
        { name: '✅ Salons copiés',       value: `${created}`,      inline: true },
        { name: '❌ Erreurs',             value: `${errors}`,       inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
