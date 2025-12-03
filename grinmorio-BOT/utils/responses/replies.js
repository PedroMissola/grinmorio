import { successEmbed, errorEmbed, infoEmbed, warnEmbed } from './embeds.js';

/**
 * Valida se a interaction é válida e está em estado utilizável
 * @param {*} interaction Objeto de interação
 * @returns {boolean} True se válida
 */
const isValidInteraction = (interaction) => {
  if (!interaction || typeof interaction !== 'object') {
    console.error('Interaction inválida ou null');
    return false;
  }
  
  if (typeof interaction.reply !== 'function' && 
      typeof interaction.editReply !== 'function' && 
      typeof interaction.followUp !== 'function') {
    console.error('Interaction não possui métodos necessários');
    return false;
  }
  
  return true;
};

/**
 * Tenta enviar uma resposta usando o método mais apropriado
 * @param {object} interaction Interação do Discord
 * @param {object} payload Payload da resposta
 * @returns {Promise<void>}
 */
const sendSafeReply = async (interaction, payload) => {
  // Respeita o valor de ephemeral passado no payload
  const safePayload = { ...payload };
  
  try {
    // Se já respondeu ou diferiu, usa followUp
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(safePayload);
    }
    
    // Caso contrário, usa reply normal
    return await interaction.reply(safePayload);
  } catch (error) {
    // Se reply falhar, tenta editReply como última tentativa
    if (interaction.deferred) {
      try {
        return await interaction.editReply(safePayload);
      } catch (editError) {
        console.error('Falha ao enviar resposta (editReply também falhou):', editError);
        throw editError;
      }
    }
    
    console.error('Falha ao enviar resposta:', error);
    throw error;
  }
};

/**
 * Objeto para lidar com o envio de respostas padronizadas ao Discord.
 */
export const reply = {
  /**
   * Envia uma resposta de sucesso (verde).
   * @param {object} interaction Interação do Discord
   * @param {*} title Título da mensagem
   * @param {*} description Descrição da mensagem
   * @returns {Promise<void>}
   */
  success: async (interaction, title, description) => {
    if (!isValidInteraction(interaction)) {
      console.error('Não foi possível enviar resposta de sucesso: interaction inválida');
      return;
    }
    
    try {
      const embed = successEmbed(title, description);
      await sendSafeReply(interaction, { embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Erro ao enviar resposta de sucesso:', error);
      // Tenta enviar mensagem de erro como fallback
      try {
        await sendSafeReply(interaction, { 
          content: '✅ Operação concluída com sucesso.',
          ephemeral: true
        });
      } catch (fallbackError) {
        console.error('Falha crítica ao enviar resposta de sucesso:', fallbackError);
      }
    }
  },

  /**
   * Envia uma resposta de erro (vermelha).
   * @param {object} interaction Interação do Discord
   * @param {*} title Título da mensagem
   * @param {*} description Descrição da mensagem
   * @returns {Promise<void>}
   */
  error: async (interaction, title, description) => {
    if (!isValidInteraction(interaction)) {
      console.error('Não foi possível enviar resposta de erro: interaction inválida');
      return;
    }
    
    try {
      const embed = errorEmbed(title, description);
      await sendSafeReply(interaction, { embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Erro ao enviar resposta de erro:', error);
      // Tenta enviar mensagem de texto simples como fallback
      try {
        await sendSafeReply(interaction, { 
          content: '❌ Ocorreu um erro ao processar sua solicitação.',
          ephemeral: true
        });
      } catch (fallbackError) {
        console.error('Falha crítica ao enviar resposta de erro:', fallbackError);
      }
    }
  },

  /**
   * Envia uma resposta de informação (azul).
   * @param {object} interaction Interação do Discord
   * @param {*} title Título da mensagem
   * @param {*} description Descrição da mensagem
   * @returns {Promise<void>}
   */
  info: async (interaction, title, description) => {
    if (!isValidInteraction(interaction)) {
      console.error('Não foi possível enviar resposta de info: interaction inválida');
      return;
    }
    
    try {
      const embed = infoEmbed(title, description);
      await sendSafeReply(interaction, { embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Erro ao enviar resposta de informação:', error);
      // Tenta enviar mensagem de texto simples como fallback
      try {
        await sendSafeReply(interaction, { 
          content: 'ℹ️ Informação disponível.',
          ephemeral: true
        });
      } catch (fallbackError) {
        console.error('Falha crítica ao enviar resposta de info:', fallbackError);
      }
    }
  },

  /**
   * Envia uma resposta de aviso (amarela).
   * @param {object} interaction Interação do Discord
   * @param {*} title Título da mensagem
   * @param {*} description Descrição da mensagem
   * @returns {Promise<void>}
   */
  warn: async (interaction, title, description) => {
    if (!isValidInteraction(interaction)) {
      console.error('Não foi possível enviar resposta de aviso: interaction inválida');
      return;
    }
    
    try {
      const embed = warnEmbed(title, description);
      await sendSafeReply(interaction, { embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Erro ao enviar resposta de aviso:', error);
      // Tenta enviar mensagem de texto simples como fallback
      try {
        await sendSafeReply(interaction, { 
          content: '⚠️ Atenção necessária.',
          ephemeral: true
        });
      } catch (fallbackError) {
        console.error('Falha crítica ao enviar resposta de aviso:', fallbackError);
      }
    }
  },

  /**
   * Envia uma resposta customizada
   * @param {object} interaction Interação do Discord
   * @param {object} options Opções da resposta (embed, content, components, etc)
   * @returns {Promise<void>}
   */
  custom: async (interaction, options = {}) => {
    if (!isValidInteraction(interaction)) {
      console.error('Não foi possível enviar resposta customizada: interaction inválida');
      return;
    }
    
    try {
      // Padrão é PÚBLICO. Só é privado se options.ephemeral === true
      const payload = { ...options, ephemeral: options.ephemeral === true };
      await sendSafeReply(interaction, payload);
    } catch (error) {
      console.error('Erro ao enviar resposta customizada:', error);
      // Tenta enviar mensagem genérica como fallback
      try {
        await sendSafeReply(interaction, { 
          content: 'Resposta não disponível.',
          ephemeral: true
        });
      } catch (fallbackError) {
        console.error('Falha crítica ao enviar resposta customizada:', fallbackError);
      }
    }
  },

  /**
   * Edita uma resposta existente
   * @param {object} interaction Interação do Discord
   * @param {object} options Novas opções da resposta
   * @returns {Promise<void>}
   */
  edit: async (interaction, options = {}) => {
    if (!isValidInteraction(interaction)) {
      console.error('Não foi possível editar resposta: interaction inválida');
      return;
    }
    
    try {
      await interaction.editReply(options);
    } catch (error) {
      console.error('Erro ao editar resposta:', error);
    }
  },

  /**
   * Deleta a resposta
   * @param {object} interaction Interação do Discord
   * @returns {Promise<void>}
   */
  delete: async (interaction) => {
    if (!isValidInteraction(interaction)) {
      console.error('Não foi possível deletar resposta: interaction inválida');
      return;
    }
    
    try {
      await interaction.deleteReply();
    } catch (error) {
      // Ignora erros comuns ao deletar (mensagem já deletada, etc)
      if (error.code !== 10008 && error.code !== 'InteractionNotEditable') {
        console.error('Erro ao deletar resposta:', error);
      }
    }
  }
};