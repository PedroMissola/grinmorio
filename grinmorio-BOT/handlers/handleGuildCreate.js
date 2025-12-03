import { ChannelType, PermissionsBitField } from 'discord.js';
import log from '../utils/logger.js';
import { embeds } from '../utils/responses/embeds.js';
import { botHasPermissionInChannel } from '../utils/security/permissions.js';
import { trackEvent, updateGuildSettings } from '../utils/analytics.js';

export default async function handleGuildCreate(guild) {
  log.event('guildCreate', `Bot adicionado ao servidor: "${guild.name}" (ID: ${guild.id}) com ${guild.memberCount} membros.`);

  // 🔹 1. Registra o evento de entrada
  trackEvent('GUILD_JOIN', {
    guildId: guild.id,
    guildName: guild.name,
    memberCount: guild.memberCount,
  });

  // 🔹 2. Cria ou atualiza as configurações da guilda na API
  try {
    await updateGuildSettings(guild.id, {
      guildName: guild.name,
      memberCount: guild.memberCount,
      lastUpdated: new Date().toISOString(),
    });
    log.info(`Configuração criada/atualizada para o servidor "${guild.name}".`);
  } catch (error) {
    log.warn(`Falha ao criar configuração para "${guild.name}":`, error.message);
  }

  try {
    const welcomeEmbed = embeds.info(
      `Saudações, ${guild.name}!`,
      `Sou o **${guild.client.user.username}**, seu novo assistente de servidor!`
    )
      .setThumbnail(guild.client.user.displayAvatarURL())
      .addFields(
        {
          name: '🎯 Comandos',
          value: '• Digite `/` para descobrir todos os meus comandos.\n• Use `/help` para um guia completo.',
        }
      )
      .setFooter({
        text: 'Estou aqui para ajudar!',
        iconURL: guild.iconURL() || undefined
      })
      .setTimestamp();

    let targetChannel = null;

    if (guild.systemChannel && botHasPermissionInChannel(guild.systemChannel, PermissionsBitField.Flags.SendMessages)) {
      targetChannel = guild.systemChannel;
    }

    if (!targetChannel) {
      targetChannel = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText &&
        (c.name.toLowerCase().includes('geral') || c.name.toLowerCase().includes('chat')) &&
        botHasPermissionInChannel(c, PermissionsBitField.Flags.SendMessages)
      );
    }

    if (!targetChannel) {
      targetChannel = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText &&
        botHasPermissionInChannel(c, [
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.EmbedLinks
        ])
      );
    }

    if (targetChannel) {
      await targetChannel.send({ embeds: [welcomeEmbed] });
      log.info(`Mensagem de boas-vindas enviada para "${guild.name}" no canal #${targetChannel.name}`);
    } else {
      log.warn(`Nenhum canal adequado encontrado em "${guild.name}" para enviar boas-vindas.`);
    }

  } catch (error) {
    log.error(`Erro ao processar entrada no servidor "${guild.name}":`, error);
  }
}
