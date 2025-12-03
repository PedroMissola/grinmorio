import { embeds } from '../utils/responses/embeds.js';
import log from '../utils/logger.js';
import handleRollMessage from './handleRollMessage.js';
import { trackEvent, sendLog } from '../utils/analytics.js';
import { getGuildPrefix } from '#utils/guildSettings';

export default async function handleMessage(client, message) {
  if (message.author.bot || !message.guild) return;

  if (message.mentions.has(client.user.id)) {
    const mentionEmbed = embeds.info(
        `Saudações, ${message.author.displayName}!`,
        `Sou o **${client.user.username}**, seu assistente para D&D 5e! Digite \`/\` para ver meus comandos ou defina um prefixo com \`/setprefix\`.`
      )
      .setThumbnail(client.user.displayAvatarURL())
      .addFields({
        name: '🎲 Rolagens Rápidas no Chat',
        value: '`1d20+5`, `vantagem`, `iniciativa(+3)`, `3#1d20+2`'
      });

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

  // Lógica para comandos de prefixo
  const prefix = await getGuildPrefix(client, message.guild.id);
  if (message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      // Manipulador de comandos de prefixo simples
      if (commandName === 'ping') {
          const msg = await message.reply('Pingando...');
          const latency = msg.createdTimestamp - message.createdTimestamp;
          return await msg.edit(`Pong! Latência da mensagem: ${latency}ms. Latência da API: ${Math.round(client.ws.ping)}ms`);
      }
      // Adicione outros comandos de prefixo aqui
      
      // Se um comando de prefixo foi processado (ou tentado), não continue para a rolagem de texto
      return;
  }

  try {
    await handleRollMessage(message);
  } catch (error) {
    log.error(`Erro não capturado no fluxo de handleMessage para "${message.content}":`, error);
    sendLog('error', 'Erro inesperado ao processar mensagem de texto', {
      content: message.content,
      userId: message.author.id,
      guildId: message.guild?.id,
      errorMessage: error.message,
    });
  }
}