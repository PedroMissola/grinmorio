import { EmbedBuilder, codeBlock } from 'discord.js';
import log from './logger.js';
import { reply } from './responses/replies.js';
import { sendLog, trackEvent } from './analytics.js'; // NOVO

// Limites de tamanho para evitar erros do Discord
const LIMITS = {
  EMBED_FIELD_VALUE: 1024,
  CODE_BLOCK: 1000,
};

/**
 * Trunca texto para caber em um code block
 * @param {string} text Texto a truncar
 * @param {number} maxLength Tamanho máximo
 * @returns {string} Texto truncado
 */
const truncateForCodeBlock = (text, maxLength = LIMITS.CODE_BLOCK) => {
  if (!text) return 'N/A';
  
  const str = String(text);
  if (str.length <= maxLength) return str;
  
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Extrai informações seguras do erro
 * @param {*} error Objeto de erro
 * @returns {object} Informações formatadas
 */
const extractErrorInfo = (error) => {
  const info = {
    message: 'Erro desconhecido',
    stack: '',
    code: null,
    name: 'Error',
  };
  
  try {
    if (error instanceof Error) {
      info.message = error.message || 'Sem mensagem de erro';
      info.stack = error.stack || '';
      info.code = error.code || null;
      info.name = error.name || 'Error';
    } else if (typeof error === 'string') {
      info.message = error;
    } else if (error && typeof error === 'object') {
      info.message = error.message || JSON.stringify(error);
      info.code = error.code || null;
    } else {
      info.message = String(error);
    }
  } catch (extractError) {
    log.error('Erro ao extrair informações do erro:', extractError);
    info.message = 'Não foi possível extrair detalhes do erro';
  }
  
  return info;
};

/**
 * Extrai informações seguras da interaction
 * @param {*} interaction Objeto de interação
 * @returns {object} Informações formatadas
 */
const extractInteractionInfo = (interaction) => {
  const info = {
    commandName: 'DESCONHECIDO',
    userTag: 'DESCONHECIDO',
    userId: 'DESCONHECIDO',
    guildName: 'DM',
    guildId: 'N/A',
    channelId: 'DESCONHECIDO',
  };
  
  try {
    if (!interaction || typeof interaction !== 'object') {
      return info;
    }
    
    info.commandName = interaction.commandName || 'DESCONHECIDO';
    
    if (interaction.user) {
      info.userTag = interaction.user.tag || `ID:${interaction.user.id || 'DESCONHECIDO'}`;
      info.userId = interaction.user.id || 'DESCONHECIDO';
    }
    
    if (interaction.guild) {
      info.guildName = interaction.guild.name || `ID:${interaction.guild.id || 'DESCONHECIDO'}`;
      info.guildId = interaction.guild.id || 'N/A';
    }
    
    if (interaction.channelId) {
      info.channelId = interaction.channelId;
    } else if (interaction.channel && interaction.channel.id) {
      info.channelId = interaction.channel.id;
    }
  } catch (extractError) {
    log.error('Erro ao extrair informações da interaction:', extractError);
  }
  
  return info;
};

/**
 * Envia resposta de erro para o usuário de forma segura
 * @param {object} interaction Interação do Discord
 * @returns {Promise<boolean>} True se enviou com sucesso
 */
const sendUserErrorResponse = async (interaction) => {
  try {
    await reply.error(
      interaction,
      'Ops! Algo Deu Errado',
      'Um erro inesperado ocorreu ao tentar executar este comando. A equipe técnica já foi notificada e está trabalhando para resolver!'
    );
    return true;
  } catch (replyError) {
    log.error('Falha ao enviar a mensagem de erro para o usuário:', replyError);
    
    // Tenta método alternativo
    try {
      const errorMessage = {
        content: '❌ Ocorreu um erro ao processar seu comando. Por favor, tente novamente mais tarde.',
        ephemeral: true,
      };
      
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
      return true;
    } catch (fallbackError) {
      log.error('Falha crítica ao enviar mensagem de erro:', fallbackError);
      return false;
    }
  }
};

/**
 * Envia log de erro para canal privado do Discord
 * @param {object} interaction Interação do Discord
 * @param {object} errorInfo Informações do erro
 * @param {object} interactionInfo Informações da interação
 * @returns {Promise<boolean>} True se enviou com sucesso
 */
const sendErrorLog = async (interaction, errorInfo, interactionInfo) => {
  const logChannelId = process.env.BOT_LOG_CHANNEL_ID;
  
  if (!logChannelId) {
    log.info('BOT_LOG_CHANNEL_ID não configurado - log de erro não será enviado ao Discord');
    return false;
  }
  
  try {
    // Valida o client
    if (!interaction.client || typeof interaction.client.channels?.fetch !== 'function') {
      log.warn('Client inválido para enviar log de erro');
      return false;
    }
    
    const logChannel = await interaction.client.channels.fetch(logChannelId).catch(err => {
      log.warn(`Não foi possível buscar o canal de log ${logChannelId}:`, err);
      return null;
    });
    
    if (!logChannel) {
      log.warn(`Canal de log ${logChannelId} não encontrado`);
      return false;
    }
    
    if (!logChannel.isTextBased || !logChannel.isTextBased()) {
      log.warn(`Canal ${logChannelId} não é um canal de texto`);
      return false;
    }
    
    // Cria o embed de erro
    const errorEmbed = new EmbedBuilder()
      .setTitle(`🚨 Erro de Comando: /${interactionInfo.commandName}`)
      .setColor('#FF0000')
      .addFields(
        { 
          name: '👤 Usuário', 
          value: `${interactionInfo.userTag}\nID: \`${interactionInfo.userId}\``, 
          inline: true 
        },
        { 
          name: '🏠 Servidor', 
          value: `${interactionInfo.guildName}\nID: \`${interactionInfo.guildId}\``, 
          inline: true 
        },
        { 
          name: '📝 Canal', 
          value: `\`${interactionInfo.channelId}\``, 
          inline: true 
        },
        { 
          name: '❌ Tipo de Erro', 
          value: `\`${errorInfo.name}\`${errorInfo.code ? ` (Código: ${errorInfo.code})` : ''}`, 
          inline: false 
        },
        { 
          name: '📄 Mensagem', 
          value: codeBlock(truncateForCodeBlock(errorInfo.message, LIMITS.EMBED_FIELD_VALUE - 10)), 
          inline: false 
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Sistema de Monitoramento de Erros' });
    
    // Adiciona stack trace se disponível
    if (errorInfo.stack) {
      const truncatedStack = truncateForCodeBlock(errorInfo.stack, LIMITS.EMBED_FIELD_VALUE - 10);
      errorEmbed.addFields({
        name: '🔍 Stack Trace',
        value: codeBlock('javascript', truncatedStack),
        inline: false
      });
    }
    
    await logChannel.send({ embeds: [errorEmbed] });
    log.info('Log de erro enviado ao canal do Discord com sucesso');
    return true;
  } catch (logError) {
    log.error('Falha ao enviar o log de erro para o canal do Discord:', logError);
    return false;
  }
};

/**
 * Lida com erros ocorridos durante a execução de um comando de forma centralizada.
 * * @param {Error|*} error O objeto do erro que foi capturado.
 * @param {import('discord.js').Interaction} interaction A interação que causou o erro.
 * @returns {Promise<void>}
 */
export async function handleCommandError(error, interaction) {
  // Extrai informações de forma segura
  const errorInfo = extractErrorInfo(error);
  const interactionInfo = extractInteractionInfo(interaction);
  
  // 1. Log detalhado no console para o desenvolvedor
  log.error(
    `Erro ao executar o comando /${interactionInfo.commandName} ` +
    `(Usuário: ${interactionInfo.userTag}, Servidor: ${interactionInfo.guildName}):`,
    error
  );

  // NOVO: Rastreia o evento de erro para estatísticas
  trackEvent('COMMAND_ERROR', {
    commandName: interactionInfo.commandName,
    errorMessage: errorInfo.message,
    guildId: interactionInfo.guildId,
  });

  // NOVO: Envia o log detalhado para a API
  sendLog('error', `Erro no comando /${interactionInfo.commandName}`, {
    error: errorInfo,
    interaction: interactionInfo,
  });
  
  // 2. Resposta amigável e segura para o usuário (nunca exponha o erro real)
  const userNotified = await sendUserErrorResponse(interaction);
  
  if (!userNotified) {
    log.warn('Não foi possível notificar o usuário sobre o erro');
  }
  
  // 3. Log em um canal privado do Discord para monitoramento (se configurado)
  await sendErrorLog(interaction, errorInfo, interactionInfo);
}

/**
 * Lida com erros não capturados do processo
 * Deve ser registrado no arquivo principal (index.js)
 * 
 * @param {Error} error Erro não capturado
 */
export function handleUncaughtError(error) {
  log.error('ERRO NÃO CAPTURADO:', error);
  
  // Em produção, você pode querer enviar notificações críticas aqui
  if (process.env.NODE_ENV === 'production') {
    // Adicione lógica de notificação crítica aqui (email, webhook, etc)
    log.error('ATENÇÃO: Erro crítico não capturado em produção!');
  }
}

/**
 * Lida com rejeições de Promise não tratadas
 * Deve ser registrado no arquivo principal (index.js)
 * 
 * @param {*} reason Razão da rejeição
 * @param {Promise} promise Promise rejeitada
 */
export function handleUnhandledRejection(reason, promise) {
  log.error('REJEIÇÃO DE PROMISE NÃO TRATADA:', reason);
  log.error('Promise:', promise);
  
  // Em produção, você pode querer enviar notificações críticas aqui
  if (process.env.NODE_ENV === 'production') {
    log.error('ATENÇÃO: Rejeição de Promise não tratada em produção!');
  }
}

/**
 * Cria um wrapper seguro para executar comandos
 * Envolve a função de execução em try-catch automático
 * 
 * @param {Function} executeFunction Função execute do comando
 * @returns {Function} Função wrapped com tratamento de erro
 */
export function wrapCommandExecution(executeFunction) {
  return async (interaction) => {
    try {
      await executeFunction(interaction);
    } catch (error) {
      await handleCommandError(error, interaction);
    }
  };
}

/**
 * Middleware para validar interaction antes da execução
 * 
 * @param {*} interaction Interação a validar
 * @returns {boolean} True se válida
 */
export function validateInteraction(interaction) {
  if (!interaction || typeof interaction !== 'object') {
    log.error('Interaction inválida recebida');
    return false;
  }
  
  if (!interaction.user || !interaction.user.id) {
    log.error('Interaction sem dados de usuário');
    return false;
  }
  
  if (!interaction.commandName) {
    log.error('Interaction sem commandName');
    return false;
  }
  
  return true;
}