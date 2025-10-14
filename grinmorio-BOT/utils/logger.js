/**
 * Sistema de logging robusto para o bot Discord
 * Protegido contra valores null, undefined e tipos inválidos
 */

const formatTime = () => {
  try {
    return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch (error) {
    // Fallback caso haja problema com timezone
    return new Date().toISOString();
  }
};

/**
 * Converte qualquer valor para string de forma segura
 */
const safeStringify = (value) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

/**
 * Formata detalhes do erro de forma segura
 */
const formatError = (error) => {
  if (!error) return '';
  
  if (error instanceof Error) {
    const stack = error.stack || '';
    return `\n${error.name}: ${error.message}\n${stack}`;
  }
  
  if (typeof error === 'object') {
    try {
      return `\n${JSON.stringify(error, null, 2)}`;
    } catch {
      return `\n${String(error)}`;
    }
  }
  
  return `\n${String(error)}`;
};

const log = {
  /**
   * Registra uma mensagem informativa
   * @param {*} message A mensagem a ser registrada
   */
  info: (message) => {
    try {
      const safeMessage = safeStringify(message);
      console.log(`[${formatTime()}] [INFO] ${safeMessage}`);
    } catch (error) {
      console.log(`[${formatTime()}] [INFO] [ERRO AO FORMATAR MENSAGEM]`);
    }
  },

  /**
   * Registra um aviso
   * @param {*} message A mensagem de aviso
   */
  warn: (message) => {
    try {
      const safeMessage = safeStringify(message);
      console.warn(`[${formatTime()}] [WARN] ${safeMessage}`);
    } catch (error) {
      console.warn(`[${formatTime()}] [WARN] [ERRO AO FORMATAR MENSAGEM]`);
    }
  },

  /**
   * Registra um erro com detalhes completos
   * @param {*} message A mensagem de erro
   * @param {Error|object|*} error O objeto de erro (opcional)
   */
  error: (message, error) => {
    try {
      const safeMessage = safeStringify(message);
      const errorDetails = formatError(error);
      console.error(`[${formatTime()}] [ERROR] ${safeMessage}${errorDetails}`);
    } catch (logError) {
      console.error(`[${formatTime()}] [ERROR] [ERRO CRÍTICO NO LOGGER]`);
      console.error(logError);
    }
  },

  /**
   * Registra la ejecución de un comando
   * @param {object} interaction O objeto de interação do Discord
   */
  command: (interaction) => {
    try {
      // Validação de segurança completa
      if (!interaction || typeof interaction !== 'object') {
        log.warn('Tentativa de log de comando com interaction inválida ou null');
        return;
      }

      // Extrai informações com fallbacks seguros
      const commandName = interaction.commandName || 'COMANDO_DESCONHECIDO';
      
      let userTag = 'USUÁRIO_DESCONHECIDO';
      if (interaction.user && typeof interaction.user === 'object') {
        userTag = interaction.user.tag || `ID:${interaction.user.id || 'DESCONHECIDO'}`;
      }
      
      let guildName = 'DM';
      if (interaction.guild && typeof interaction.guild === 'object') {
        guildName = interaction.guild.name || `ID:${interaction.guild.id || 'DESCONHECIDO'}`;
      }
      
      console.log(`[${formatTime()}] [CMD] /${commandName} executado por ${userTag} em "${guildName}"`);
    } catch (error) {
      log.error('Erro ao registrar execução de comando:', error);
    }
  },

  /**
   * Registra eventos gerais do bot
   * @param {string} eventName Nome do evento
   * @param {*} details Detalhes do evento (opcional)
   */
  event: (eventName, details) => {
    try {
      const safeName = safeStringify(eventName);
      const safeDetails = details ? ` - ${safeStringify(details)}` : '';
      console.log(`[${formatTime()}] [EVENT] ${safeName}${safeDetails}`);
    } catch (error) {
      console.log(`[${formatTime()}] [EVENT] [ERRO AO FORMATAR EVENTO]`);
    }
  },

  // /**
  //  * Registra informações de debug (use apenas em desenvolvimento)
  //  * @param {*} message Mensagem de debug
  //  * @param {*} data Dados adicionais (opcional)
  //  */
  // debug: (message, data) => {
  //   if (process.env.NODE_ENV !== 'production') {
  //     try {
  //       const safeMessage = safeStringify(message);
  //       const safeData = data ? `\n${safeStringify(data)}` : '';
  //       console.debug(`[${formatTime()}] [DEBUG] ${safeMessage}${safeData}`);
  //     } catch (error) {
  //       console.debug(`[${formatTime()}] [DEBUG] [ERRO AO FORMATAR DEBUG]`);
  //     }
  //   }
  // }
};

export default log;