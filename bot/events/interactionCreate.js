const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const config = require('../config.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ─── Slash Commands ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        const msg = { content: '❌ Une erreur est survenue.', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(msg);
        } else {
          await interaction.reply(msg);
        }
      }
      return;
    }

    // ─── Bouton : Ouvrir un ticket premium ───────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'premium_ticket') {
      await interaction.deferReply({ ephemeral: true });

      const guild = interaction.guild;
      const member = interaction.member;
      const categoryId = config.get(guild.id, 'ticketCategoryId');

      // Vérifier s'il n'a pas déjà un ticket ouvert
      const existingTicket = guild.channels.cache.find(
        c => c.name === `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` &&
             c.topic?.includes(member.id)
      );
      if (existingTicket) {
        return interaction.editReply({
          content: `❌ Tu as déjà un ticket ouvert : ${existingTicket}`,
        });
      }

      // Créer le salon ticket
      const ticketChannel = await guild.channels.create({
        name: `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`,
        type: ChannelType.GuildText,
        topic: `Ticket premium de ${member.user.tag} | ID: ${member.id}`,
        parent: categoryId || null,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: guild.ownerId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
            ],
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageRoles,
            ],
          },
        ],
      });

      // Embed dans le ticket
      const ticketEmbed = new EmbedBuilder()
        .setTitle('💎 Demande Premium')
        .setDescription(
          `Bonjour ${member} !\n\n` +
          `Merci pour ta demande d'accès premium.\n` +
          `Un owner va examiner ta demande et te répondre rapidement.\n\n` +
          `**L'owner peut :**\n` +
          `✅ **Accepter** → Te donner le rôle premium\n` +
          `❌ **Refuser** → Fermer le ticket (mute 24h)`
        )
        .setColor('#FFD700')
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: `Ticket de ${member.user.tag}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_accept_${member.id}`)
          .setLabel('Accepter ✅')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`ticket_refuse_${member.id}`)
          .setLabel('Refuser ❌')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`ticket_close_${member.id}`)
          .setLabel('Fermer 🔒')
          .setStyle(ButtonStyle.Secondary),
      );

      await ticketChannel.send({
        content: `<@${guild.ownerId}> | ${member}`,
        embeds: [ticketEmbed],
        components: [row],
      });

      await interaction.editReply({
        content: `✅ Ton ticket a été créé : ${ticketChannel}`,
      });
      return;
    }

    // ─── Bouton : Accepter le ticket ─────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('ticket_accept_')) {
      const targetId = interaction.customId.replace('ticket_accept_', '');
      const guild = interaction.guild;

      // Vérifier que c'est bien l'owner ou un admin
      if (
        interaction.user.id !== guild.ownerId &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({ content: '❌ Seul un owner/admin peut accepter.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const premiumRoleId = config.get(guild.id, 'premiumRoleId');
      const targetMember = await guild.members.fetch(targetId).catch(() => null);

      if (!targetMember) {
        return interaction.editReply({ content: '❌ Membre introuvable.' });
      }

      // Attribuer le rôle si configuré
      if (premiumRoleId) {
        const role = guild.roles.cache.get(premiumRoleId);
        if (role) {
          await targetMember.roles.add(role).catch(console.error);
        }
      }

      // Message dans le ticket
      const acceptEmbed = new EmbedBuilder()
        .setTitle('✅ Demande Acceptée !')
        .setDescription(
          `${targetMember} ta demande premium a été **acceptée** par ${interaction.user} !\n\n` +
          (premiumRoleId ? `🎉 Le rôle <@&${premiumRoleId}> t'a été attribué.` : '🎉 Bienvenue dans le premium !')
        )
        .setColor('#00FF7F')
        .setTimestamp();

      await interaction.channel.send({ embeds: [acceptEmbed] });

      // MP à l'utilisateur
      try {
        await targetMember.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('💎 Accès Premium Accordé !')
              .setDescription(
                `Félicitations ! Ta demande premium sur **${guild.name}** a été acceptée.\n\n` +
                (premiumRoleId ? `Le rôle <@&${premiumRoleId}> t'a été attribué.` : 'Tu as maintenant accès au contenu premium.')
              )
              .setColor('#FFD700')
              .setTimestamp(),
          ],
        });
      } catch { /* DM fermés */ }

      // Désactiver les boutons
      await disableButtons(interaction);

      // Fermer tous les tickets ouverts après 5 secondes
      await interaction.channel.send({ content: '🔒 Fermeture de tous les tickets dans 5 secondes...' });
      setTimeout(async () => {
        const tickets = guild.channels.cache.filter(c => c.name.startsWith('ticket-'));
        for (const [, ch] of tickets) {
          await ch.delete().catch(() => {});
        }
      }, 5000);

      await interaction.editReply({ content: '✅ Demande acceptée, rôle attribué, tous les tickets fermés dans 5s.' });
      return;
    }

    // ─── Bouton : Refuser le ticket ───────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('ticket_refuse_')) {
      const targetId = interaction.customId.replace('ticket_refuse_', '');
      const guild = interaction.guild;

      if (
        interaction.user.id !== guild.ownerId &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({ content: '❌ Seul un owner/admin peut refuser.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const targetMember = await guild.members.fetch(targetId).catch(() => null);
      const refusMessage = config.get(guild.id, 'refusMessage') ||
        'Ta demande premium sur {server} a été refusée. Tu as été mute pendant 24h pour perte de temps.';

      // Mute 24h (timeout)
      if (targetMember) {
        const muteEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await targetMember.timeout(24 * 60 * 60 * 1000, 'Demande premium refusée — perte de temps').catch(console.error);

        // MP
        try {
          const msg = refusMessage
            .replace('{user}', targetMember.user.tag)
            .replace('{server}', guild.name);
          await targetMember.send({
            embeds: [
              new EmbedBuilder()
                .setTitle('❌ Demande Premium Refusée')
                .setDescription(msg)
                .setColor('#FF0000')
                .addFields({
                  name: '🔇 Mute',
                  value: `Tu es mute jusqu'au <t:${Math.floor(muteEnd.getTime() / 1000)}:F>`,
                })
                .setTimestamp(),
            ],
          });
        } catch { /* DM fermés */ }
      }

      // Message dans le ticket
      const refusEmbed = new EmbedBuilder()
        .setTitle('❌ Demande Refusée')
        .setDescription(
          `${targetMember ?? `<@${targetId}>`} ta demande a été **refusée** par ${interaction.user}.\n\n` +
          `🔇 Tu es mute pendant **24 heures**.\nUn MP t'a été envoyé.`
        )
        .setColor('#FF0000')
        .setTimestamp();

      await interaction.channel.send({ embeds: [refusEmbed] });

      // Désactiver les boutons
      await disableButtons(interaction);

      // Supprimer le ticket après 5 secondes
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);

      await interaction.editReply({ content: '✅ Demande refusée, membre mute 24h, ticket fermé dans 5s.' });
      return;
    }

    // ─── Bouton : Fermer le ticket ────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('ticket_close_')) {
      const guild = interaction.guild;

      if (
        interaction.user.id !== guild.ownerId &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({ content: '❌ Seul un owner/admin peut fermer le ticket.', ephemeral: true });
      }

      await interaction.reply({ content: '🔒 Ticket fermé. Suppression dans 5 secondes...', ephemeral: false });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      return;
    }
  },
};

/**
 * Désactive tous les boutons du message original du ticket.
 */
async function disableButtons(interaction) {
  try {
    const messages = await interaction.channel.messages.fetch({ limit: 10 });
    const ticketMsg = messages.find(m => m.components.length > 0 && m.author.bot);
    if (ticketMsg) {
      const disabledRows = ticketMsg.components.map(row => {
        const newRow = new ActionRowBuilder();
        newRow.addComponents(
          row.components.map(btn =>
            ButtonBuilder.from(btn).setDisabled(true)
          )
        );
        return newRow;
      });
      await ticketMsg.edit({ components: disabledRows });
    }
  } catch { /* message déjà supprimé ou inaccessible */ }
}
