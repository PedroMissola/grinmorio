import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} from 'discord.js';
import log from '#utils/logger';
import { reply } from '#responses/replies';
import { safeGet, awaitModalSafely, updatePersonagem, CONFIG } from '../utils.js';

export async function handleEditMagia(interaction, personagem) {
  const m = personagem.magiaInfo || {};
  const modal = new ModalBuilder()
    .setCustomId(`edit_magia_${interaction.id}`)
    .setTitle('Editar Informações de Magia');

  modal.addComponents(
    ...[
      ['classeConjuradora', 'Classe Conjuradora'],
      ['atributo', 'Atributo de Conjuração'],
      ['cdDasMagias', 'CD para Evitar Magias'],
      ['bonusDeAtaqueMagico', 'Bônus de Ataque Mágico'],
    ].map(([id, label]) =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(id)
          .setLabel(label)
          .setStyle(TextInputStyle.Short)
          .setValue(String(safeGet(m, id, '')))
      )
    )
  );

  await interaction.showModal(modal);
  const modalSubmit = await awaitModalSafely(interaction, CONFIG.MODAL_TIMEOUT_SHORT);
  if (!modalSubmit) return;
  await modalSubmit.deferReply({ ephemeral: true });

  const updates = {
    magiaInfo: {
      classeConjuradora: modalSubmit.fields.getTextInputValue('classeConjuradora').trim(),
      atributo: modalSubmit.fields.getTextInputValue('atributo').trim(),
      cdDasMagias: parseInt(modalSubmit.fields.getTextInputValue('cdDasMagias')) || 8,
      bonusDeAtaqueMagico: parseInt(modalSubmit.fields.getTextInputValue('bonusDeAtaqueMagico')) || 0,
    }
  };

  await updatePersonagem(interaction.guild.id, interaction.user.id, updates);
  await reply.success(modalSubmit, 'Magia Atualizada!', `Informações mágicas de **${personagem.nome}** salvas.`);
  log.info(`${interaction.user.tag} atualizou magia de ${personagem.nome}`);
}
