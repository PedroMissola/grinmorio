// ARQUIVO: commands/sv.js

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import api from '#utils/api';

export const data = new SlashCommandBuilder()
  .setName('sv')
  .setDescription('Gerencia suas salvaguardas contra a morte.')
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
  .addSubcommand(sub => sub.setName('sucesso').setDescription('Registra um sucesso na salvaguarda contra a morte.'))
  .addSubcommand(sub => sub.setName('falha').setDescription('Registra uma falha na salvaguarda contra a morte.'))
  .addSubcommand(sub => sub.setName('reset').setDescription('Zera os contadores de sucessos e falhas (ao ser curado/estabilizado).'));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  const tipo = interaction.options.getSubcommand();

  try {
    const { data } = await api.post(`/personagens/${guildId}/${userId}/salvaguarda-morte`, { tipo });

    const embed = new EmbedBuilder()
      .setTitle('💀 Salvaguarda Contra a Morte')
      .setDescription(data.message)
      .addFields(
        { name: 'Sucessos', value: `**${data.sucessos}** / 3`, inline: true },
        { name: 'Falhas', value: `**${data.falhas}** / 3`, inline: true }
      )
      .setColor(0x757575);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error(`Erro no comando /sv:`, error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || 'Ocorreu um erro ao atualizar sua salvaguarda.';
    await interaction.editReply({ content: `❌ ${errorMessage}` });
  }
}