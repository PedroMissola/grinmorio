import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} from 'discord.js';
import log from '#utils/logger';
import { reply } from '#responses/replies';
import { safeGet, awaitModalSafely, updatePersonagem, CONFIG } from '../utils.js';

export async function handleEditAparencia(interaction, personagem) {
  const a = personagem.aparencia || {};
  const modal = new ModalBuilder()
    .setCustomId(`edit_aparencia_${interaction.id}`)
    .setTitle('Editar Aparência');

  modal.addComponents(
    ...['idade', 'altura', 'peso', 'olhos'].map(k =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(k)
          .setLabel(k.charAt(0).toUpperCase() + k.slice(1))
          .setStyle(TextInputStyle.Short)
          .setValue(safeGet(a, k, ''))
      )
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('cabelo_pele')
        .setLabel('Cabelo | Pele')
        .setStyle(TextInputStyle.Short)
        .setValue(`${safeGet(a, 'cabelo', '')} | ${safeGet(a, 'pele', '')}`)
    )
  );

  await interaction.showModal(modal);
  const modalSubmit = await awaitModalSafely(interaction, CONFIG.MODAL_TIMEOUT_SHORT);
  if (!modalSubmit) return;
  await modalSubmit.deferReply({ ephemeral: true });

  const [cabelo, pele] = modalSubmit.fields.getTextInputValue('cabelo_pele').split('|').map(s => s.trim());
  const updates = {
    aparencia: {
      idade: modalSubmit.fields.getTextInputValue('idade').trim(),
      altura: modalSubmit.fields.getTextInputValue('altura').trim(),
      peso: modalSubmit.fields.getTextInputValue('peso').trim(),
      olhos: modalSubmit.fields.getTextInputValue('olhos').trim(),
      cabelo, pele,
    }
  };

  await updatePersonagem(interaction.guild.id, interaction.user.id, updates);
  await reply.success(modalSubmit, 'Aparência Atualizada!', `Aparência de **${personagem.nome}** salva.`);
  log.info(`${interaction.user.tag} atualizou aparência de ${personagem.nome}`);
}
