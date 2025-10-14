import { handleCommandError, validateInteraction } from '../utils/errorHandler.js';
import { checkPermissions } from '../utils/security/permissions.js';
import { checkCooldown } from '../utils/security/cooldowns.js';
import log from '../utils/logger.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, client) {
  // Valida a interação básica
  if (!validateInteraction(interaction)) {
    log.warn('Interação inválida recebida');
    return;
  }

  try {
    // Delega para handleInteraction se existir
    try {
      const { default: handleInteraction } = await import('../handlers/handleInteraction.js');
      if (typeof handleInteraction === 'function') {
        await handleInteraction(interaction, client);
        return;
      }
    } catch (handlerError) {
      // Se o handler não existir, processa aqui
      log.debug('Handler de interação customizado não encontrado, usando padrão');
    }

    // Processamento padrão de comandos
    if (interaction.isChatInputCommand()) {
      await handleChatCommand(interaction, client);
    } else if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction, client);
    } else if (interaction.isButton()) {
      log.debug(`Botão clicado: ${interaction.customId}`);
    } else if (interaction.isStringSelectMenu()) {
      log.debug(`Select menu usado: ${interaction.customId}`);
    }
  } catch (error) {
    await handleCommandError(error, interaction);
  }
}
/**
 * Processa comandos de chat
 */
async function handleChatCommand(interaction, client) {
  const command = client.commands?.get(interaction.commandName);

  if (!command) {
    log.warn(`Comando não encontrado: ${interaction.commandName}`);
    await interaction.reply({
      content: '❌ Este comando não está disponível no momento.',
      ephemeral: true
    }).catch(() => { });
    return;
  }

  try {
    // Log do comando
    log.command(interaction);

    // 1. Verifica permissões (se definidas)
    if (command.permissions) {
      const hasPermissions = await checkPermissions(interaction, command.permissions);
      if (!hasPermissions) return;
    }

    // 2. Verifica cooldown
    const canExecute = await checkCooldown(interaction, command);
    if (!canExecute) return;

    // 3. Executa o comando
    await command.execute(interaction);
  } catch (error) {
    await handleCommandError(error, interaction);
  }
}

/**
 * Processa autocomplete
 */
async function handleAutocomplete(interaction, client) {
  const command = client.commands?.get(interaction.commandName);

  if (!command || !command.autocomplete) {
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    log.error(`Erro no autocomplete de ${interaction.commandName}:`, error);
  }
}