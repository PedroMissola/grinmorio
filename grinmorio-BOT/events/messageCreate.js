import log from '../utils/logger.js';
import handleMessage from '../handlers/handleMessage.js';

export const name = 'messageCreate';
export const once = false;

export async function execute(message, client) {
  if (!message || typeof message !== 'object' || message.author?.bot) {
    return;
  }

  try {
    await handleMessage(client, message);
  } catch (error) {
    log.error('Erro ao processar o evento de mensagem:', error);
  }
}