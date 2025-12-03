import { handleCommandError, validateInteraction } from '#utils/errorHandler';
import handleInteraction from '#handlers/handleInteraction';
import log from '#utils/logger';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, client) {
  // Valida a interação básica
  if (!validateInteraction(interaction)) {
    log.warn('Interação inválida recebida');
    return;
  }

  try {
    // Delega todo o processamento para o handler de interação
    await handleInteraction(interaction, client);
  } catch (error) {
    // Captura erros que possam ocorrer no próprio handler
    await handleCommandError(error, interaction);
  }
}
