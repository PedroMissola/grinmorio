import api from '../utils/api.js';
import log from '../utils/logger.js';
import { checkCooldown } from '../utils/security/cooldowns.js';
import { checkPermissions } from '../utils/security/permissions.js';
import { handleCommandError } from '../utils/errorHandler.js';
import { reply } from '../utils/responses/replies.js';
import { trackEvent } from '../utils/analytics.js';

export default async function handleInteraction(interaction, client) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    log.warn(`Comando não encontrado: ${interaction.commandName}`);
    return;
  }

  try {
    const { data: banStatus } = await api.get(`/usuarios/${interaction.user.id}/status`);
    if (banStatus.isBanned) {
      return await reply.error(interaction, 'Acesso Negado', 'Você está banido de usar os comandos deste bot.');
    }

    const canExecuteCooldown = await checkCooldown(interaction, command);
    if (!canExecuteCooldown) {
      return; 
    }

    if (command.permissions) {
      const hasPermissions = await checkPermissions(interaction, command.permissions);
      if (!hasPermissions) {
        return;
      }
    }

    await command.execute(interaction);
    log.command(interaction);

    trackEvent('COMMAND_USED', {
      commandName: interaction.commandName,
      userId: interaction.user.id,
      guildId: interaction.guild?.id,
      channelId: interaction.channel?.id,
    });

  } catch (error) {
    await handleCommandError(error, interaction);
  }
}