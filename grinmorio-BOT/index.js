import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';
import loadCommands from './core/commandLoader.js';
import loadEvents from './core/eventLoader.js';
import { iniciarConsoleManager } from './utils/consoleBanManager.js';
import log from './utils/logger.js';
import { stopCleanupTimer } from './utils/security/cooldowns.js';
import { trackEvent } from './utils/analytics.js';

/**
 * @returns {boolean} True se todas as variáveis estão presentes
 */
function validateEnvironment() {
  const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'API_BASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Erro: Variáveis de ambiente faltando: ${missing.join(', ')}`);
    console.error('Por favor, verifique seu arquivo .env');
    return false;
  }
  
  return true;
}

/**
 * @returns {Client|null} Cliente configurado ou null em caso de erro
 */
function createDiscordClient() {
  try {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // Útil para comandos de moderação
      ],
      // Configurações adicionais recomendadas
      failIfNotExists: false, // Evita erros se recursos não existirem
      restTimeOffset: 0, // Ajuste de tempo para rate limiting
    });

    // Inicializa as coleções necessárias
    client.commands = new Collection();
    client.cooldowns = new Collection();
    
    log.info('Cliente Discord criado com sucesso');
    return client;
  } catch (error) {
    console.error('❌ Erro ao criar cliente Discord:', error);
    return null;
  }
}

/**
 * Configura handlers para desligamento gracioso
 * @param {Client} client Cliente do Discord
 */
function setupGracefulShutdown(client) {
  const shutdown = async (signal) => {
    log.warn(`Sinal ${signal} recebido. Iniciando desligamento gracioso...`);
    
    try {
      // Para o timer de limpeza de cooldowns
      stopCleanupTimer();
      log.info('Timer de cooldowns parado');
      
      await trackEvent('BOT_SHUTDOWN', { signal });

      // Destrói o cliente
      if (client && typeof client.destroy === 'function') {
        client.destroy();
        log.info('Cliente Discord desconectado');
      }
      
      log.info('Bot desligado com sucesso');
      process.exit(0);
    } catch (error) {
      log.error('Erro durante o desligamento:', error);
      process.exit(1);
    }
  };
  
  // Escuta sinais de desligamento
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Previne crash em caso de erro não tratado
  process.on('uncaughtException', (error) => {
    log.error('ERRO NÃO CAPTURADO (uncaughtException):', error);
    trackEvent('UNCAUGHT_EXCEPTION', {
      message: error.message,
      stack: error.stack,
    }).catch(() => {});
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    log.error('PROMISE NÃO TRATADA (unhandledRejection):', reason);
    trackEvent('UNHANDLED_REJECTION', {
      reason: String(reason),
    }).catch(() => {});
  });
}

/**
 * Inicializa o bot
 */
async function initializeBot() {
  try {
    log.info('=== Iniciando bot Discord ===');
    
    // 1. Valida ambiente
    if (!validateEnvironment()) {
      process.exit(1);
    }
    
    // 2. Cria o cliente
    const client = createDiscordClient();
    if (!client) {
      log.error('Falha ao criar cliente Discord');
      process.exit(1);
    }
    
    // 3. Configura desligamento gracioso
    setupGracefulShutdown(client);
    
    // 4. Obtém diretórios do projeto
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // 5. Carrega comandos
    log.info('Carregando comandos...');
    const commandsLoaded = await loadCommands(client, __dirname);
    if (!commandsLoaded) {
      log.warn('Alguns comandos podem não ter sido carregados corretamente');
    }
    
    // 6. Carrega eventos
    log.info('Carregando eventos...');
    const eventsLoaded = await loadEvents(client, __dirname);
    if (!eventsLoaded) {
      log.warn('Alguns eventos podem não ter sido carregados corretamente');
    }
    
    // 7. Faz login
    log.info('Conectando ao Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    
    // 8. Inicializa console manager (se disponível)
    try {
      if (typeof iniciarConsoleManager === 'function') {
        iniciarConsoleManager(client);
        log.info('Console Manager inicializado');
      }
    } catch (consoleError) {
      log.warn('Console Manager não pôde ser inicializado:', consoleError);
      // Não é crítico, continua a execução
    }

    await trackEvent('BOT_STARTUP');
    log.info('=== Bot inicializado com sucesso ===');
  } catch (error) {
    log.error('Erro fatal durante a inicialização do bot:', error);
    trackEvent('BOT_FATAL_ERROR', { message: error.message }).catch(() => {});
    process.exit(1);
  }
}

// Inicia o bot
initializeBot().catch(error => {
  console.error('❌ Erro fatal não capturado:', error);
  process.exit(1);
});