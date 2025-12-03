import api from '#utils/api';
import log from '#utils/logger';
import { checkCooldown } from '#security/cooldowns';
import { checkPermissions } from '#security/permissions';
import { handleCommandError } from '#utils/errorHandler';
import { reply } from '#responses/replies';
import { trackEvent } from '#utils/analytics';

async function handleChatCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        log.warn(`Comando não encontrado: ${interaction.commandName}`);
        await reply.error(interaction, 'Comando não encontrado', 'Este comando não está disponível no momento.');
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

export default async function handleInteraction(interaction, client) {
    if (interaction.isChatInputCommand()) {
        await handleChatCommand(interaction, client);
    } else if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction, client);
    } else if (interaction.isButton()) {
        log.debug(`Botão clicado: ${interaction.customId}`);
        // Button handling logic would go here
    } else if (interaction.isStringSelectMenu()) {
        log.debug(`Select menu usado: ${interaction.customId}`);
        // Select menu handling logic would go here
    }
}
