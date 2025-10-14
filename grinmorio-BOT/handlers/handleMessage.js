import { embeds } from '../utils/responses/embeds.js';
import log from '../utils/logger.js';
import handleRollMessage from './handleRollMessage.js';
import { trackEvent, sendLog } from '../utils/analytics.js';

export default async function handleMessage(client, message) {
  if (message.author.bot) return;

  if (message.mentions.has(client.user.id)) {
    const mentionEmbed = embeds.info(
        `Saudações, ${message.author.displayName}!`,
        `Sou o **${client.user.username}**, seu assistente para D&D 5e! Digite \`/\` para ver meus comandos.`
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