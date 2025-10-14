import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} from 'discord.js';
import log from '#utils/logger';
import { reply } from '#responses/replies';
import { safeGet, awaitModalSafely, updatePersonagem, CONFIG } from '../utils.js';

export async function handleEditHistoria(interaction, personagem) {
  const modal = new ModalBuilder()
    .setCustomId(`edit_historia_${interaction.id}`)
    .setTitle('Editar História e Aliados');

  modal.addComponents(
    ...['historia', 'aliadosEOrganizacoes', 'tesouros'].map(k =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(k)
          .setLabel(k.charAt(0).toUpperCase() + k.slice(1))
          .setStyle(TextInputStyle.Paragraph)
          .setValue(safeGet(personagem, k, ''))
      )
    )
  );

  await interaction.showModal(modal);
  const modalSubmit = await awaitModalSafely(interaction, CONFIG.MODAL_TIMEOUT);
  if (!modalSubmit) return;
  await modalSubmit.deferReply({ ephemeral: true });

  const updates = {
    historia: modalSubmit.fields.getTextInputValue('historia').trim(),
    aliadosEOrganizacoes: modalSubmit.fields.getTextInputValue('aliadosEOrganizacoes').trim(),
    tesouros: modalSubmit.fields.getTextInputValue('tesouros').trim(),
  };

  await updatePersonagem(interaction.guild.id, interaction.user.id, updates);
  await reply.success(modalSubmit, 'História Atualizada!', `História de **${personagem.nome}** salva.`);
  log.info(`${interaction.user.tag} atualizou história de ${personagem.nome}`);
}
