const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Créer ou modifier le panel premium dans ce salon')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('titre')
        .setDescription('Titre du panel')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('description')
        .setDescription('Description du panel (utilise \\n pour les sauts de ligne)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('couleur')
        .setDescription('Couleur hex du panel (ex: #FFD700)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('image')
        .setDescription('URL de l\'image principale du panel')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('thumbnail')
        .setDescription('URL de la miniature (coin haut droite)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('footer')
        .setDescription('Texte du footer')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('label_bouton')
        .setDescription('Texte du bouton premium (défaut: Payer le premium 💎)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const titre = interaction.options.getString('titre') || '💎 PREMIUM';
    const description = (interaction.options.getString('description') || 
      'Accède au contenu exclusif en cliquant sur le bouton ci-dessous !')
      .replace(/\\n/g, '\n');
    const couleur = interaction.options.getString('couleur') || '#FFD700';
    const image = interaction.options.getString('image') || null;
    const thumbnail = interaction.options.getString('thumbnail') || null;
    const footer = interaction.options.getString('footer') || interaction.guild.name;
    const labelBouton = interaction.options.getString('label_bouton') || 'Payer le premium 💎';

    // Validation couleur hex
    const hexRegex = /^#([A-Fa-f0-9]{6})$/;
    const couleurValide = hexRegex.test(couleur) ? couleur : '#FFD700';

    const embed = new EmbedBuilder()
      .setTitle(titre)
      .setDescription(description)
      .setColor(couleurValide)
      .setFooter({ text: footer, iconURL: interaction.guild.iconURL() })
      .setTimestamp();

    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('premium_ticket')
        .setLabel(labelBouton)
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💎')
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.editReply({ content: '✅ Panel envoyé avec succès !' });
  },
};
