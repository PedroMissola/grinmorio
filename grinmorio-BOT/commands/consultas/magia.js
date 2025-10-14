// ARQUIVO: commands/magia.js

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import api from '../../utils/api.js';

export const data = new SlashCommandBuilder()
  .setName('magia')
  .setDescription('Gerencia seus espaços de magia.')
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
  .addSubcommand(sub =>
    sub.setName('slots')
      .setDescription('Define o total de espaços de magia para cada nível (1 a 9).')
      .addStringOption(opt =>
        opt.setName('totais')
          .setDescription('Valores separados por vírgula. Ex: 4,3,2,0,0,0,0,0,0')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('usar')
      .setDescription('Gasta um espaço de magia de um determinado nível.')
      .addIntegerOption(opt =>
        opt.setName('nivel')
          .setDescription('O nível do espaço de magia a ser gasto.')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(9)
      )
  )
  .addSubcommand(sub =>
    sub.setName('recuperar')
      .setDescription('Recupera todos os espaços de magia gastos (descanso longo).')
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  const subcomando = interaction.options.getSubcommand();

  let payload = { tipo: subcomando };
  if (subcomando === 'slots') {
    payload.valor = interaction.options.getString('totais');
  } else if (subcomando === 'usar') {
    payload.valor = interaction.options.getInteger('nivel');
  }

  try {
    const { data } = await api.post(`/personagens/${guildId}/${userId}/gerenciar-magia`, payload);

    const embed = new EmbedBuilder()
      .setTitle('✨ Espaços de Magia Atualizados!')
      .setDescription(data.message)
      .setColor(0x5865F2);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error(`Erro no comando /magia:`, error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || 'Ocorreu um erro ao gerenciar seus espaços de magia.';
    await interaction.editReply({ content: `❌ ${errorMessage}` });
  }
}