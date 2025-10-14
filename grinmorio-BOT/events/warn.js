import log from '../utils/logger.js';
import { sendLog } from '../utils/analytics.js'; // NOVO

export const name = 'warn';
export const once = false;

export async function execute(warning, client) {
  log.warn('Aviso do Discord.js:', warning);

  // NOVO: Envia o log de aviso para a API
  sendLog('warn', 'Aviso da biblioteca Discord.js', {
    warningMessage: warning,
  });
}