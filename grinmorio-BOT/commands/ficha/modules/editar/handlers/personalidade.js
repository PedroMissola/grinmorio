import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} from 'discord.js';
import log from '#utils/logger';
import { reply } from '#responses/replies';
import { safeGet, awaitModalSafely, updatePersonagem, CONFIG } from '../utils.js';

export async function handleEditPersonalidade(interaction, personagem) {
  const p = personagem.personalidade || {};
  const modal = new ModalBuilder()
    .setCustomId(`edit_personalidade_${interaction.id}`)
    .setTitle('Editar Personalidade');

  modal.addComponents(
    ...['tracos', 'ideais', 'ligacoes', 'fraquezas'].map(key =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(key)
          .setLabel(key.charAt(0).toUpperCase() + key.slice(1))
          .setStyle(TextInputStyle.Paragraph)
          .setValue(safeGet(p, key, ''))
      )
    )
  );

  await interaction.showModal(modal);
  const modalSubmit = await awaitModalSafely(interaction, CONFIG.MODAL_TIMEOUT);
  if (!modalSubmit) return;
  await modalSubmit.deferReply({ ephemeral: true });

  const updates = {
    personalidade: {
      tracos: modalSubmit.fields.getTextInputValue('tracos').trim(),
      ideais: modalSubmit.fields.getTextInputValue('ideais').trim(),
      ligacoes: modalSubmit.fields.getTextInputValue('ligacoes').trim(),
      fraquezas: modalSubmit.fields.getTextInputValue('fraquezas').trim(),
    }
  };

  await updatePersonagem(interaction.guild.id, interaction.user.id, updates);
  await reply.success(modalSubmit, 'Personalidade Atualizada!', `Personalidade de **${personagem.nome}** salva.`);
  log.info(`${interaction.user.tag} atualizou personalidade de ${personagem.nome}`);
}
