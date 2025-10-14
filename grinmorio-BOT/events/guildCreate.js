import log from '../utils/logger.js';

export const name = 'guildCreate';
export const once = false;

export async function execute(guild, client) {
  // Valida a guild
  if (!guild || !guild.id) {
    log.warn('Guild inválida recebida no evento guildCreate');
    return;
  }

  try {
    const guildName = guild.name || 'Nome Desconhecido';
    const memberCount = guild.memberCount || 0;
    const ownerId = guild.ownerId || 'Desconhecido';

    log.info(`📥 Bot adicionado a novo servidor:`);
    log.info(`   - Nome: ${guildName}`);
    log.info(`   - ID: ${guild.id}`);
    log.info(`   - Membros: ${memberCount}`);
    log.info(`   - Dono ID: ${ownerId}`);

    // Delega para handleGuildCreate se existir
    try {
      const { default: handleGuildCreate } = await import('../handlers/handleGuildCreate.js');
      if (typeof handleGuildCreate === 'function') {
        await handleGuildCreate(guild);
      }
    } catch (handlerError) {
      log.debug('Handler de guildCreate customizado não encontrado');
    }

    // Atualiza estatísticas
    const totalGuilds = client.guilds.cache.size || 0;
    log.info(`📊 Total de servidores: ${totalGuilds}`);
  } catch (error) {
    log.error('Erro ao processar entrada em novo servidor:', error);
  }
}