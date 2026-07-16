const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;
    const channelId = config.get(guild.id, 'welcomeChannelId');

    if (!channelId) return; // Salon non configuré

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('👋 Nouveau membre !')
      .setDescription(
        `Bienvenue ${member} sur **${guild.name}** !\n\n` +
        `Tu es le **${guild.memberCount}ème** membre.`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor('#FFD700')
      .setFooter({ text: 'Message supprimé dans 5 secondes' })
      .setTimestamp();

    const msg = await channel.send({
      content: `${member}`,
      embeds: [embed],
    });

    // Suppression automatique après 5 secondes
    setTimeout(() => msg.delete().catch(() => {}), 5000);
  },
};
