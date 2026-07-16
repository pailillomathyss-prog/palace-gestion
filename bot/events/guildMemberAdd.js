const config = require('../config.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;
    const channelId = config.get(guild.id, 'welcomeChannelId');

    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const msg = await channel.send(`${member}`);

    // Suppression automatique après 5 secondes
    setTimeout(() => msg.delete().catch(() => {}), 5000);
  },
};
