import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} from 'discord.js';
import log from '#utils/logger';
import { reply } from '#responses/replies';
import { safeGet, awaitModalSafely, updatePersonagem, CONFIG } from '../utils.js';

export async function handleEditProficiencias(interaction, personagem) {
  const pericias = personagem.pericias || {};
  const salvaguardas = personagem.salvaguardas || {};

  const periciasAtivas = Object.keys(pericias).filter(k => pericias[k]).join(', ');
  const salvaguardasAtivas = Object.keys(salvaguardas).filter(k => salvaguardas[k]).join(', ');

  const modal = new ModalBuilder()
    .setCustomId(`edit_proficiencias_${interaction.id}`)
    .setTitle('Editar Proficiências');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('pericias')
        .setLabel('Perícias')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(periciasAtivas)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('salvaguardas')
        .setLabel('Salvaguardas')
        .setStyle(TextInputStyle.Short)
        .setValue(salvaguardasAtivas)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('outras')
        .setLabel('Outras Proficiências e Idiomas')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(safeGet(personagem, 'outrasProficienciasEIdiomas', ''))
    )
  );

  await interaction.showModal(modal);
  const modalSubmit = await awaitModalSafely(interaction, CONFIG.MODAL_TIMEOUT_SHORT);
  if (!modalSubmit) return;
  await modalSubmit.deferReply({ ephemeral: true });

  const periciasInput = modalSubmit.fields.getTextInputValue('pericias').toLowerCase().split(',').map(p => p.trim());
  const salvaguardasInput = modalSubmit.fields.getTextInputValue('salvaguardas').toLowerCase().split(',').map(s => s.trim());

  const novasPericias = {};
  Object.keys(pericias).forEach(k => { novasPericias[k] = periciasInput.includes(k.toLowerCase()); });

  const novasSalvaguardas = {};
  Object.keys(salvaguardas).forEach(k => { novasSalvaguardas[k] = salvaguardasInput.includes(k.toLowerCase()); });

  const updates = {
    pericias: novasPericias,
    salvaguardas: novasSalvaguardas,
    outrasProficienciasEIdiomas: modalSubmit.fields.getTextInputValue('outras').trim()
  };

  await updatePersonagem(interaction.guild.id, interaction.user.id, updates);
  await reply.success(modalSubmit, 'Proficiências Atualizadas!', `Proficiências de **${personagem.nome}** salvas.`);
  log.info(`${interaction.user.tag} atualizou proficiências de ${personagem.nome}`);
}
