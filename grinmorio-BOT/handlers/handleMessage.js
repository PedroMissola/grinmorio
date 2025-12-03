import { embeds } from '../utils/responses/embeds.js';
import log from '../utils/logger.js';
import { trackEvent, sendLog } from '../utils/analytics.js';
import { getGuildPrefix } from '#utils/guildSettings';

export default async function handleMessage(client, message) {
  if (message.author.bot || !message.guild) return;

  // Handle mentions
  if (message.mentions.has(client.user.id)) {
    const mentionEmbed = embeds.info(
        `Saudações, ${message.author.displayName}!`,
        `Sou o **${client.user.username}**, seu assistente de servidor! Digite \`/\` para ver meus comandos ou defina um prefixo com \`/setprefix\`.`
      )
      .setThumbnail(client.user.displayAvatarURL());

    try {
      await message.reply({ embeds: [mentionEmbed] });
      log.info(`Resposta a menção enviada para ${message.author.tag} em "${message.guild?.name}"`);

      trackEvent('BOT_MENTIONED', {
        userId: message.author.id,
        guildId: message.guild?.id,
      });

    } catch (error) {
      log.error('Erro ao enviar embed de menção:', error);
      sendLog('error', 'Falha ao responder menção', {
        userId: message.author.id,
        guildId: message.guild?.id,
        errorMessage: error.message,
      });
    }
    return;
  }

  // Handle prefix commands (example)
  const prefix = await getGuildPrefix(client, message.guild.id);
  if (message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      // Simple prefix command handler example
      if (commandName === 'ping') {
          const msg = await message.reply('Pingando...');
          const latency = msg.createdTimestamp - message.createdTimestamp;
          return await msg.edit(`Pong! Latência da mensagem: ${latency}ms. Latência da API: ${Math.round(client.ws.ping)}ms`);
      }
      // Add other prefix commands here if needed
  }
}