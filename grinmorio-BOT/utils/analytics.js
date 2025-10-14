import api from './api.js';
import log from './logger.js';

/**
 * * @param {string} eventName O nome do evento (ex: 'COMMAND_USED', 'GUILD_JOIN').
 * @param {object} [details={}] Detalhes adicionais sobre o evento.
 */
export async function trackEvent(eventName, details = {}) {
  try {
    await api.post('/stats/record', {
      event: eventName,
      details: details,
    });
    log.debug(`Evento [${eventName}] rastreado com sucesso.`);
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    log.warn(`Falha ao rastrear evento '${eventName}':`, errorMessage);
  }
}

/**
 * * @param {'info' | 'warn' | 'error'} level O nível do log.
 * @param {string} message A mensagem principal do log.
 * @param {object} [details={}] Dados estruturados adicionais para o log.
 */
export async function sendLog(level, message, details = {}) {
  try {
    await api.post('/logs', {
      level,
      message,
      details,
    });
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    log.error(`Falha ao enviar log para a API:`, errorMessage);
  }
}

/**
 * * @param {string} guildId ID do servidor.
 * @returns {Promise<object|null>} As configurações ou null em caso de erro.
 */
export async function getGuildSettings(guildId) {
    try {
        const { data } = await api.get(`/guilds/${guildId}/settings`);
        return data;
    } catch (error) {
        log.error(`Falha ao buscar configurações para o servidor ${guildId}:`, error.response?.data?.message || error.message);
        return null;
    }
}

/**
 * * @param {string} guildId ID do servidor.
 * @param {object} settings Novas configurações.
 * @returns {Promise<object|null>} A resposta da API ou null em caso de erro.
 */
export async function updateGuildSettings(guildId, settings) {
    try {
        const { data } = await api.put(`/guilds/${guildId}/settings`, { settings });
        return data;
    } catch (error) {
        log.error(`Falha ao atualizar configurações para o servidor ${guildId}:`, error.response?.data?.message || error.message);
        return null;
    }
}