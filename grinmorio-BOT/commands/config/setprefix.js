import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { reply } from '#responses/replies';
import { handleCommandError } from '#utils/errorHandler';
import { updateGuildPrefix } from '#utils/guildSettings';

export const data = new SlashCommandBuilder()
    .setName('setprefix')
    .setDescription('Define o prefixo de comandos para este servidor.')
    .addStringOption(option =>
        option.setName('prefixo')
            .setDescription('O novo prefixo a ser usado (ex: !, ?, .)')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false);

export const cooldown = 10;

export const permissions = {
    user: [PermissionFlagsBits.ManageGuild],
};

export async function execute(interaction) {
    try {
        const newPrefix = interaction.options.getString('prefixo');

        if (newPrefix.length > 3) {
            return await reply.error(interaction, 'Prefixo Muito Longo', 'O prefixo não pode ter mais de 3 caracteres.');
        }

        if (/\s/.test(newPrefix)) {
            return await reply.error(interaction, 'Prefixo Inválido', 'O prefixo não pode conter espaços.');
        }

        const success = await updateGuildPrefix(interaction.client, interaction.guild.id, newPrefix);

        if (success) {
            await reply.success(interaction, 'Prefixo Atualizado', `O prefixo de comandos do servidor foi alterado para \`${newPrefix}\`.`);
        } else {
            await reply.error(interaction, 'Erro ao Atualizar', 'Não foi possível atualizar o prefixo no banco de dados. Tente novamente mais tarde.');
        }

    } catch (error) {
        await handleCommandError(error, interaction);
    }
}
