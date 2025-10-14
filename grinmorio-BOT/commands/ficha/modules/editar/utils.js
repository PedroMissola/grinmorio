import log from '#utils/logger';
import api from '#utils/api';

// Configurações de tempo padrão para modais
export const CONFIG = {
  MODAL_TIMEOUT: 600000, // 10 min
  MODAL_TIMEOUT_SHORT: 300000, // 5 min
};

// Verifica se o personagem tem os campos básicos
export function validatePersonagem(personagem) {
  if (!personagem || typeof personagem !== 'object') return false;

  const requiredFields = [
    'nome', 'atributos', 'pericias',
    'salvaguardas', 'personalidade', 'aparencia', 'magiaInfo'
  ];

  for (const field of requiredFields) {
    if (!personagem[field]) {
      log.warn(`Campo obrigatório ausente: ${field}`);
      return false;
    }
  }

  return true;
}

// Acessa caminho seguro (ex: 'atributos.forca')
export function safeGet(obj, path, defaultValue = '') {
  try {
    const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

// Aguarda resposta de modal com segurança
export async function awaitModalSafely(interaction, timeout) {
  try {
    const modalSubmit = await interaction.awaitModalSubmit({ time: timeout });
    return modalSubmit;
  } catch (error) {
    if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
      log.info(`Modal timeout: ${interaction.user.tag}`);
      return null;
    }
    throw error;
  }
}

// Atualiza personagem via API
export async function updatePersonagem(guildId, userId, updates) {
  try {
    await api.put(`/personagens/${guildId}/${userId}`, { updates });
    return true;
  } catch (error) {
    log.error('Erro ao atualizar personagem:', error);
    throw error;
  }
}
