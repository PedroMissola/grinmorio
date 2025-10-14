import { Collection } from 'discord.js';
import { reply } from '../responses/replies.js';
import log from '../logger.js';

// Configurações de segurança
const COOLDOWN_CONFIG = {
  DEFAULT_COOLDOWN: 3, // segundos
  MIN_COOLDOWN: 0.5, // mínimo de 500ms
  MAX_COOLDOWN: 3600, // máximo de 1 hora
  CLEANUP_INTERVAL: 300000, // Limpa cooldowns expirados a cada 5 minutos
};

// Timer para limpeza periódica
let cleanupTimer = null;

/**
 * Valida se a interaction é utilizável
 * @param {*} interaction Objeto de interação
 * @returns {boolean} True se válida
 */
function isValidInteraction(interaction) {
  if (!interaction || typeof interaction !== 'object') {
    log.error('checkCooldown: interaction inválida ou null');
    return false;
  }
  
  if (!interaction.user || !interaction.user.id) {
    log.error('checkCooldown: interaction sem dados de usuário');
    return false;
  }
  
  if (!interaction.client) {
    log.error('checkCooldown: interaction sem client');
    return false;
  }
  
  return true;
}

/**
 * Valida se o comando tem estrutura válida
 * @param {*} command Objeto do comando
 * @returns {boolean} True se válido
 */
function isValidCommand(command) {
  if (!command || typeof command !== 'object') {
    log.error('checkCooldown: command inválido ou null');
    return false;
  }
  
  if (!command.data || !command.data.name) {
    log.error('checkCooldown: command sem data.name');
    return false;
  }
  
  return true;
}

/**
 * Sanitiza o valor do cooldown
 * @param {*} cooldown Valor do cooldown
 * @returns {number} Cooldown em segundos, validado
 */
function sanitizeCooldown(cooldown) {
  try {
    const value = parseFloat(cooldown);
    
    if (isNaN(value) || value <= 0) {
      return COOLDOWN_CONFIG.DEFAULT_COOLDOWN;
    }
    
    // Garante que está dentro dos limites
    return Math.max(
      COOLDOWN_CONFIG.MIN_COOLDOWN,
      Math.min(value, COOLDOWN_CONFIG.MAX_COOLDOWN)
    );
  } catch (error) {
    log.error('Erro ao sanitizar cooldown:', error);
    return COOLDOWN_CONFIG.DEFAULT_COOLDOWN;
  }
}

/**
 * Formata tempo restante de forma legível
 * @param {number} seconds Segundos restantes
 * @returns {string} Tempo formatado
 */
function formatTimeLeft(seconds) {
  try {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`;
    }
    
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (remainingSeconds === 0) {
      return `${minutes}min`;
    }
    
    return `${minutes}min ${remainingSeconds}s`;
  } catch (error) {
    return `${seconds.toFixed(1)}s`;
  }
}

/**
 * Limpa cooldowns expirados para prevenir vazamento de memória
 * @param {Collection} cooldowns Coleção de cooldowns
 */
function cleanupExpiredCooldowns(cooldowns) {
  if (!cooldowns || typeof cooldowns.forEach !== 'function') {
    return;
  }
  
  try {
    const now = Date.now();
    let cleaned = 0;
    
    cooldowns.forEach((timestamps, commandName) => {
      if (!timestamps || typeof timestamps.forEach !== 'function') {
        return;
      }
      
      timestamps.forEach((expirationTime, userId) => {
        if (now > expirationTime) {
          timestamps.delete(userId);
          cleaned++;
        }
      });
      
      // Remove a coleção do comando se estiver vazia
      if (timestamps.size === 0) {
        cooldowns.delete(commandName);
      }
    });
    
    if (cleaned > 0) {
      log.debug(`Limpeza de cooldowns: ${cleaned} entradas removidas`);
    }
  } catch (error) {
    log.error('Erro ao limpar cooldowns expirados:', error);
  }
}

/**
 * Inicializa o sistema de cooldowns no client se ainda não existir
 * @param {import('discord.js').Client} client Client do Discord
 */
function initializeCooldowns(client) {
  try {
    if (!client.cooldowns) {
      client.cooldowns = new Collection();
      log.info('Sistema de cooldowns inicializado');
    }
    
    // Configura limpeza periódica se ainda não estiver configurada
    if (!cleanupTimer) {
      cleanupTimer = setInterval(() => {
        cleanupExpiredCooldowns(client.cooldowns);
      }, COOLDOWN_CONFIG.CLEANUP_INTERVAL);
      
      log.info('Timer de limpeza de cooldowns configurado');
    }
  } catch (error) {
    log.error('Erro ao inicializar cooldowns:', error);
  }
}

/**
 * Verifica se um usuário está em cooldown para um determinado comando.
 * Se estiver, envia uma mensagem de aviso. Se não, registra o novo tempo de uso.
 * 
 * @param {import('discord.js').Interaction} interaction A interação do comando.
 * @param {object} command O objeto do comando que está sendo executado.
 * @returns {Promise<boolean>} Retorna `true` se o usuário puder executar o comando, `false` se estiver em cooldown.
 */
export async function checkCooldown(interaction, command) {
  // Validações iniciais
  if (!isValidInteraction(interaction)) {
    return true; // Falha segura: permite o comando passar
  }
  
  if (!isValidCommand(command)) {
    return true; // Falha segura
  }
  
  const client = interaction.client;
  
  // Inicializa o sistema de cooldowns se necessário
  initializeCooldowns(client);
  
  // Verifica novamente se foi inicializado com sucesso
  if (!client.cooldowns) {
    log.warn('Sistema de cooldowns não pôde ser inicializado - permitindo comando passar');
    return true;
  }
  
  try {
    const commandName = command.data.name;
    const userId = interaction.user.id;
    
    // Cada comando tem sua própria coleção de timestamps por usuário
    if (!client.cooldowns.has(commandName)) {
      client.cooldowns.set(commandName, new Collection());
    }
    
    const timestamps = client.cooldowns.get(commandName);
    
    // Valida se a coleção foi criada corretamente
    if (!timestamps || typeof timestamps.has !== 'function') {
      log.error('Coleção de timestamps inválida para o comando:', commandName);
      return true; // Falha segura
    }
    
    const now = Date.now();
    
    // Define um cooldown validado
    const cooldownSeconds = sanitizeCooldown(command.cooldown);
    const cooldownAmount = cooldownSeconds * 1000;
    
    // Verifica se o usuário está em cooldown
    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId) + cooldownAmount;
      
      // Se o tempo de expiração ainda não passou, o usuário está em cooldown
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        const formattedTime = formatTimeLeft(timeLeft);
        
        log.info(`Usuário ${interaction.user.tag} em cooldown para /${commandName} - ${formattedTime} restantes`);
        
        try {
          await reply.info(
            interaction,
            'Aguarde um Momento',
            `Por favor, espere mais **${formattedTime}** para usar o comando \`/${commandName}\` novamente.`
          );
        } catch (replyError) {
          log.error('Erro ao enviar mensagem de cooldown:', replyError);
        }
        
        return false; // Bloqueia a execução do comando
      }
    }
    
    // Se o usuário não estava em cooldown, registra o timestamp atual
    timestamps.set(userId, now);
    
    // Define um timer para remover o timestamp após o cooldown
    // Isso evita vazamento de memória
    setTimeout(() => {
      try {
        if (timestamps && typeof timestamps.delete === 'function') {
          timestamps.delete(userId);
          
          // Remove a coleção do comando se estiver vazia
          if (timestamps.size === 0 && client.cooldowns.has(commandName)) {
            client.cooldowns.delete(commandName);
          }
        }
      } catch (cleanupError) {
        log.error('Erro ao limpar cooldown individual:', cleanupError);
      }
    }, cooldownAmount);
    
    return true; // Permite a execução do comando
  } catch (error) {
    log.error('Erro ao verificar cooldown:', error);
    return true; // Falha segura: permite o comando passar em caso de erro
  }
}

/**
 * Remove o cooldown de um usuário para um comando específico
 * Útil para comandos de administração ou casos especiais
 * 
 * @param {import('discord.js').Client} client Client do Discord
 * @param {string} commandName Nome do comando
 * @param {string} userId ID do usuário
 * @returns {boolean} True se removido com sucesso
 */
export function removeCooldown(client, commandName, userId) {
  try {
    if (!client || !client.cooldowns) {
      log.warn('removeCooldown: client ou cooldowns não disponível');
      return false;
    }
    
    if (!commandName || !userId) {
      log.warn('removeCooldown: commandName ou userId inválido');
      return false;
    }
    
    if (!client.cooldowns.has(commandName)) {
      return false; // Comando não tem cooldowns ativos
    }
    
    const timestamps = client.cooldowns.get(commandName);
    
    if (timestamps.has(userId)) {
      timestamps.delete(userId);
      log.info(`Cooldown removido para usuário ${userId} no comando ${commandName}`);
      return true;
    }
    
    return false;
  } catch (error) {
    log.error('Erro ao remover cooldown:', error);
    return false;
  }
}

/**
 * Remove todos os cooldowns de um usuário
 * 
 * @param {import('discord.js').Client} client Client do Discord
 * @param {string} userId ID do usuário
 * @returns {number} Número de cooldowns removidos
 */
export function removeAllUserCooldowns(client, userId) {
  try {
    if (!client || !client.cooldowns) {
      log.warn('removeAllUserCooldowns: client ou cooldowns não disponível');
      return 0;
    }
    
    if (!userId) {
      log.warn('removeAllUserCooldowns: userId inválido');
      return 0;
    }
    
    let removed = 0;
    
    client.cooldowns.forEach((timestamps, commandName) => {
      if (timestamps.has(userId)) {
        timestamps.delete(userId);
        removed++;
      }
    });
    
    if (removed > 0) {
      log.info(`${removed} cooldowns removidos para o usuário ${userId}`);
    }
    
    return removed;
  } catch (error) {
    log.error('Erro ao remover todos os cooldowns do usuário:', error);
    return 0;
  }
}

/**
 * Obtém informações sobre o cooldown de um usuário em um comando
 * 
 * @param {import('discord.js').Client} client Client do Discord
 * @param {string} commandName Nome do comando
 * @param {string} userId ID do usuário
 * @param {number} cooldownSeconds Tempo de cooldown em segundos
 * @returns {object|null} Informações do cooldown ou null se não estiver em cooldown
 */
export function getCooldownInfo(client, commandName, userId, cooldownSeconds = COOLDOWN_CONFIG.DEFAULT_COOLDOWN) {
  try {
    if (!client || !client.cooldowns || !commandName || !userId) {
      return null;
    }
    
    if (!client.cooldowns.has(commandName)) {
      return null;
    }
    
    const timestamps = client.cooldowns.get(commandName);
    
    if (!timestamps.has(userId)) {
      return null;
    }
    
    const now = Date.now();
    const cooldownAmount = sanitizeCooldown(cooldownSeconds) * 1000;
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    
    if (now >= expirationTime) {
      // Cooldown expirado
      return null;
    }
    
    const timeLeft = (expirationTime - now) / 1000;
    
    return {
      expiresAt: expirationTime,
      timeLeft: timeLeft,
      formattedTimeLeft: formatTimeLeft(timeLeft),
      isActive: true,
    };
  } catch (error) {
    log.error('Erro ao obter informações de cooldown:', error);
    return null;
  }
}

/**
 * Limpa todos os cooldowns (útil para reinicializações)
 * 
 * @param {import('discord.js').Client} client Client do Discord
 */
export function clearAllCooldowns(client) {
  try {
    if (!client || !client.cooldowns) {
      log.warn('clearAllCooldowns: client ou cooldowns não disponível');
      return;
    }
    
    const totalCommands = client.cooldowns.size;
    let totalUsers = 0;
    
    client.cooldowns.forEach(timestamps => {
      totalUsers += timestamps.size;
    });
    
    client.cooldowns.clear();
    
    log.info(`Todos os cooldowns foram limpos (${totalCommands} comandos, ${totalUsers} usuários)`);
  } catch (error) {
    log.error('Erro ao limpar todos os cooldowns:', error);
  }
}

/**
 * Para o timer de limpeza automática
 * Útil ao desligar o bot
 */
export function stopCleanupTimer() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    log.info('Timer de limpeza de cooldowns parado');
  }
}

/**
 * Exporta as configurações para referência externa
 */
export { COOLDOWN_CONFIG };