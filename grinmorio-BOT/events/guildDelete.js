import log from '../utils/logger.js';
import { trackEvent, updateGuildSettings } from '../utils/analytics.js';

export const name = 'guildDelete';
export const once = false;

export async function execute(guild, client) {
  if (!guild || !guild.id) {
    log.warn('Guild inválida recebida no evento guildDelete');
    return;
  }

  try {
    const guildName = guild.name || 'Nome Desconhecido';
    const memberCount = guild.memberCount || 0;

    log.info(`📤 Bot removido de servidor:`);
    log.info(`   - Nome: ${guildName}`);
    log.info(`   - ID: ${guild.id}`);
    log.info(`   - Membros: ${memberCount}`);

    // 🔹 1. Registra o evento
    trackEvent('GUILD_LEAVE', {
      guildId: guild.id,
      guildName,
      memberCount,
    });

    // 🔹 2. Atualiza status da guilda no banco (mantém registro, mas marca saída)
    try {
      await updateGuildSettings(guild.id, {
        guildName,
        memberCount,
        leftAt: new Date().toISOString(),
      });
      log.info(`Configuração atualizada (saída) para o servidor "${guildName}".`);
    } catch (error) {
      log.warn(`Falha ao atualizar configuração de saída de "${guildName}":`, error.message);
    }

    const totalGuilds = client.guilds.cache.size || 0;
    log.info(`📊 Total de servidores: ${totalGuilds}`);
  } catch (error) {
    log.error('Erro ao processar remoção de servidor:', error);
  }
}
