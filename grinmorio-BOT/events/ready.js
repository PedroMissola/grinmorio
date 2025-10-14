import log from '../utils/logger.js';
import statusActivities from '../config/statusActivities.js';
import { trackEvent } from '../utils/analytics.js'; // NOVO

export const name = 'clientReady';
export const once = true;

export async function execute(client) {
  try {
    // Valida o client
    if (!client || !client.user) {
      log.error('Client ou client.user inválido no evento ready');
      return;
    }
    
    log.info(`✅ Bot online como ${client.user.tag}!`);
    
    // Popula cache de autocomplete se a função existir
    try {
      const { populateAutocompleteCache } = await import('../commands/utils/autocompleteCache.js');
      if (typeof populateAutocompleteCache === 'function') {
        await populateAutocompleteCache();
        log.info('Cache de autocomplete populado');
      }
    } catch (autocompleteError) {
      log.warn('Não foi possível carregar autocomplete cache:', autocompleteError.message);
      // Não é crítico, continua
    }

    // Configura Rich Presence rotativo
    try {
      if (Array.isArray(statusActivities) && statusActivities.length > 0) {
        // Define status inicial
        const initialActivity = statusActivities[0];
        if (initialActivity && initialActivity.name) {
          client.user.setActivity(initialActivity.name, { 
            type: initialActivity.type 
          });
        }
        
        // Configura rotação
        setInterval(() => {
          try {
            const activity = statusActivities[Math.floor(Math.random() * statusActivities.length)];
            if (activity && activity.name && client.user) {
              client.user.setActivity(activity.name, { 
                type: activity.type 
              });
            }
          } catch (activityError) {
            log.error('Erro ao atualizar atividade:', activityError);
          }
        }, 20000);
        
        log.info('🎮 Status rotativo de Rich Presence iniciado');
      }
    } catch (presenceError) {
      log.warn('Erro ao configurar Rich Presence:', presenceError);
      // Não é crítico, continua
    }

     let guildCount = 0;
    let userCount = 0;
    try {
      guildCount = client.guilds.cache.size || 0;
      userCount = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
      const channelCount = client.channels.cache.size || 0;
      
      log.info(`📊 Estatísticas:`);
      log.info(`   - Servidores: ${guildCount}`);
      log.info(`   - Usuários: ${userCount.toLocaleString('pt-BR')}`);
      log.info(`   - Canais: ${channelCount}`);
      log.info(`   - Comandos: ${client.commands?.size || 0}`);
    } catch (statsError) {
      log.warn('Erro ao coletar estatísticas:', statsError);
    }

    log.event('ready', 'Bot finalizou a sequência de inicialização');
    log.info('🚀 Bot totalmente operacional!');

    // NOVO: Rastreia o evento de inicialização bem-sucedida
    trackEvent('BOT_READY', {
      guildCount,
      userCount,
      commandsLoaded: client.commands?.size || 0,
    });

  } catch (error) {
    log.error('Erro crítico no evento READY:', error);
    // NOVO: Envia o erro crítico para a API
    sendLog('error', 'Erro crítico no evento READY', {
        errorMessage: error.message,
        stack: error.stack,
    });
  }
}