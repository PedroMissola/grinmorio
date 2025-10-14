import fs from 'fs';
import path from 'path';
import log from '../utils/logger.js';
import { handleUncaughtError, handleUnhandledRejection } from '../utils/errorHandler.js';
import { sendLog } from '../utils/analytics.js';

/**
 * Valida se um objeto de evento tem a estrutura correta
 * @param {*} event Objeto do evento
 * @param {string} fileName Nome do arquivo
 * @returns {boolean} True se válido
 */
function isValidEvent(event, fileName) {
  if (!event || typeof event !== 'object') {
    log.warn(`Evento ${fileName}: objeto inválido ou null`);
    return false;
  }

  if (!event.name || typeof event.name !== 'string') {
    log.warn(`Evento ${fileName}: propriedade 'name' não encontrada ou inválida`);
    return false;
  }

  if (!event.execute || typeof event.execute !== 'function') {
    log.warn(`Evento ${fileName}: propriedade 'execute' não é uma função`);
    return false;
  }

  return true;
}

/**
 * Extrai o objeto de evento de um módulo importado
 * @param {*} eventModule Módulo importado
 * @param {string} fileName Nome do arquivo
 * @returns {object|null} Objeto do evento ou null
 */
function extractEventObject(eventModule, fileName) {
  try {
    // Verifica se é uma exportação padrão
    if (eventModule.default && isValidEvent(eventModule.default, fileName)) {
      return eventModule.default;
    }

    // Verifica se as propriedades estão no nível raiz
    if (isValidEvent(eventModule, fileName)) {
      return eventModule;
    }

    log.warn(`Evento ${fileName}: estrutura inválida`);
    return null;
  } catch (error) {
    log.error(`Erro ao extrair evento de ${fileName}:`, error);
    return null;
  }
}

/**
 * Cria um wrapper seguro para a execução do evento
 * @param {Function} execute Função original de execução
 * @param {string} eventName Nome do evento
 * @returns {Function} Função wrapped
 */
function createSafeEventExecutor(execute, eventName) {
  return async (...args) => {
    try {
      await execute(...args);
    } catch (error) {
      log.error(`Erro ao executar evento '${eventName}':`, error);

      // Para interactionCreate, tenta responder ao usuário
      if (eventName === 'interactionCreate' && args[0]) {
        const interaction = args[0];
        try {
          if (interaction.isCommand && interaction.isCommand()) {
            const errorMessage = {
              content: '❌ Ocorreu um erro ao processar este evento. Por favor, tente novamente.',
              ephemeral: true
            };

            if (interaction.deferred || interaction.replied) {
              await interaction.followUp(errorMessage).catch(() => { });
            } else {
              await interaction.reply(errorMessage).catch(() => { });
            }
          }
        } catch (replyError) {
          log.error('Não foi possível notificar o usuário sobre o erro:', replyError);
        }
      }
    }
  };
}

/**
 * Registra um evento no cliente
 * @param {Client} client Cliente do Discord
 * @param {object} event Objeto do evento
 * @returns {boolean} True se registrou com sucesso
 */
function registerEvent(client, event) {
  try {
    const { name, execute, once } = event;

    // Cria executor seguro
    const safeExecutor = createSafeEventExecutor(execute, name);

    // Registra o evento
    if (once === true) {
      client.once(name, (...args) => safeExecutor(...args, client));
      log.info(`📌 Evento '${name}' registrado (once)`);
    } else {
      client.on(name, (...args) => safeExecutor(...args, client));
      log.info(`📌 Evento '${name}' registrado`);
    }

    return true;
  } catch (error) {
    log.error(`Erro ao registrar evento '${event.name}':`, error);
    return false;
  }
}

/**
 * Carrega todos os eventos do diretório
 * @param {Client} client Cliente do Discord
 * @param {string} projectDir Diretório raiz do projeto
 * @returns {Promise<boolean>} True se carregou com sucesso
 */
export default async function loadEvents(client, projectDir) {
  // Valida o client
  if (!client || typeof client.on !== 'function') {
    log.error('Client inválido ou sem suporte a eventos');
    return false;
  }

  try {
    const eventsPath = path.join(projectDir, 'events');

    // Verifica se o diretório existe
    if (!fs.existsSync(eventsPath)) {
      log.error(`Diretório de eventos não encontrado: ${eventsPath}`);
      return false;
    }

    // Lista todos os arquivos de evento
    const eventFiles = fs.readdirSync(eventsPath)
      .filter(file => file.endsWith('.js'));

    if (eventFiles.length === 0) {
      log.warn('Nenhum arquivo de evento encontrado');
      return true; // Não é erro crítico
    }

    log.info(`📁 Encontrados ${eventFiles.length} arquivos de evento`);

    let successCount = 0;
    let failCount = 0;

    // Carrega cada evento
    for (const file of eventFiles) {
      try {
        const filePath = path.join(eventsPath, file);
        const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;

        // log.debug(`Carregando evento: ${file}`);

        // Importa o módulo
        const eventModule = await import(fileUrl);

        // Extrai o objeto do evento
        const event = extractEventObject(eventModule, file);
        if (!event) {
          failCount++;
          continue;
        }

        // Registra o evento
        if (registerEvent(client, event)) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (fileError) {
        log.error(`Erro ao carregar arquivo ${file}:`, fileError);
        failCount++;
        // NOVO: Envia o erro para a API de logs
        sendLog('error', 'Falha ao carregar ficheiro de evento', {
          fileName: file,
          errorMessage: fileError.message,
          stack: fileError.stack,
        });
      }
    }

    log.info(`📋 Eventos carregados: ${successCount}/${eventFiles.length} (${failCount} falharam)`);

    // Registra handlers globais de erro
    log.info('Registrando handlers globais de erro...');
    process.removeAllListeners('unhandledRejection');
    process.removeAllListeners('uncaughtException');

    process.on('unhandledRejection', (reason, promise) => {
      handleUnhandledRejection(reason, promise);
    });

    process.on('uncaughtException', (error) => {
      handleUncaughtError(error);
    });

    log.info('✅ Handlers globais de erro registrados');

    return successCount > 0;
  } catch (error) {
    log.error('❌ Erro fatal ao carregar eventos:', error);
    // NOVO: Envia o erro fatal para a API
    sendLog('error', 'Erro fatal no eventLoader', {
      errorMessage: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Remove todos os listeners de um evento específico
 * @param {Client} client Cliente do Discord
 * @param {string} eventName Nome do evento
 * @returns {boolean} True se removeu com sucesso
 */
export function removeEventListeners(client, eventName) {
  try {
    if (!client || !eventName) {
      log.error('Client ou eventName inválido');
      return false;
    }

    const listenerCount = client.listenerCount(eventName);
    client.removeAllListeners(eventName);

    log.info(`Removidos ${listenerCount} listeners do evento '${eventName}'`);
    return true;
  } catch (error) {
    log.error(`Erro ao remover listeners do evento '${eventName}':`, error);
    return false;
  }
}

/**
 * Recarrega um evento específico (útil para hot-reload em desenvolvimento)
 * @param {Client} client Cliente do Discord
 * @param {string} eventFileName Nome do arquivo do evento (sem extensão)
 * @param {string} projectDir Diretório raiz do projeto
 * @returns {Promise<boolean>} True se recarregou com sucesso
 */
export async function reloadEvent(client, eventFileName, projectDir) {
  try {
    if (!client || !eventFileName) {
      log.error('Client ou eventFileName inválido');
      return false;
    }

    const eventsPath = path.join(projectDir, 'events');
    const filePath = path.join(eventsPath, `${eventFileName}.js`);

    if (!fs.existsSync(filePath)) {
      log.error(`Arquivo do evento não encontrado: ${filePath}`);
      return false;
    }

    // Importa novamente
    const fileUrl = `file://${filePath.replace(/\\/g, '/')}?update=${Date.now()}`;
    const eventModule = await import(fileUrl);

    const event = extractEventObject(eventModule, `${eventFileName}.js`);
    if (!event) {
      return false;
    }

    // Remove listeners antigos
    removeEventListeners(client, event.name);

    // Registra novamente
    if (registerEvent(client, event)) {
      log.info(`✅ Evento '${event.name}' recarregado com sucesso`);
      return true;
    }

    return false;
  } catch (error) {
    log.error(`Erro ao recarregar evento ${eventFileName}:`, error);
    return false;
  }
}