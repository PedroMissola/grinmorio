import log from '../utils/logger.js';
import { sendLog } from '../utils/analytics.js'; // NOVO

export const name = 'error';
export const once = false;

export async function execute(error, client) {
  log.error('Erro do Discord.js:', error);

  // NOVO: Envia o log de erro para a API
  sendLog('error', 'Erro da biblioteca Discord.js', {
    errorCode: error.code,
    errorMessage: error.message,
    stack: error.stack,
  });

  // Erros específicos que podem precisar de ação
  if (error.code === 'ECONNRESET') {
    log.warn('Conexão resetada - o Discord.js tentará reconectar automaticamente');
  } else if (error.code === 'ETIMEDOUT') {
    log.warn('Timeout de conexão - o Discord.js tentará reconectar automaticamente');
  }
}