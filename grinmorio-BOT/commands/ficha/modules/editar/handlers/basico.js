import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} from 'discord.js';
import log from '#utils/logger';
import { reply } from '#responses/replies';
import { safeGet, awaitModalSafely, updatePersonagem, CONFIG } from '../utils.js';

export async function handleEditBasico(interaction, personagem) {
  const modal = new ModalBuilder()
    .setCustomId(`edit_basico_${interaction.id}`)
    .setTitle('Editar Informações Básicas');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('nome')
        .setLabel('Nome do Personagem')
        .setStyle(TextInputStyle.Short)
        .setValue(safeGet(personagem, 'nome', ''))
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('jogador')
        .setLabel('Nome do Jogador')
        .setStyle(TextInputStyle.Short)
        .setValue(safeGet(personagem, 'nomeDoJogador', ''))
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('raca')
        .setLabel('Raça')
        .setStyle(TextInputStyle.Short)
        .setValue(safeGet(personagem, 'raca', ''))
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('classe')
        .setLabel('Classe')
        .setStyle(TextInputStyle.Short)
        .setValue(safeGet(personagem, 'classe', ''))
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('antecedente_alinhamento')
        .setLabel('Antecedente | Alinhamento')
        .setStyle(TextInputStyle.Short)
        .setValue(`${safeGet(personagem, 'antecedente', '')} | ${safeGet(personagem, 'alinhamento', '')}`)
    )
  );

  await interaction.showModal(modal);
  const modalSubmit = await awaitModalSafely(interaction, CONFIG.MODAL_TIMEOUT_SHORT);
  if (!modalSubmit) return;

  await modalSubmit.deferReply({ ephemeral: true });

  const [antecedente, alinhamento] =
    modalSubmit.fields.getTextInputValue('antecedente_alinhamento').split('|').map(s => s.trim());

  const updates = {
    nome: modalSubmit.fields.getTextInputValue('nome').trim(),
    nomeDoJogador: modalSubmit.fields.getTextInputValue('jogador').trim() || personagem.nomeDoJogador,
    raca: modalSubmit.fields.getTextInputValue('raca').trim() || personagem.raca,
    classe: modalSubmit.fields.getTextInputValue('classe').trim() || personagem.classe,
    antecedente: antecedente || personagem.antecedente,
    alinhamento: alinhamento || personagem.alinhamento,
  };

  await updatePersonagem(interaction.guild.id, interaction.user.id, updates);
  await reply.success(modalSubmit, 'Informações Atualizadas!', `As informações básicas de **${updates.nome}** foram salvas.`);
  log.info(`${interaction.user.tag} atualizou informações básicas de ${updates.nome}`);
}
