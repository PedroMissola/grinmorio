import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} from 'discord.js';
import log from '#utils/logger';
import { reply } from '#responses/replies';
import { safeGet, awaitModalSafely, updatePersonagem, CONFIG } from '../utils.js';

export async function handleEditStatus(interaction, personagem) {
  const modal = new ModalBuilder()
    .setCustomId(`edit_status_${interaction.id}`)
    .setTitle('Editar Status e Progresso');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('nivel_xp')
        .setLabel('Nível | XP')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 5 | 6500')
        .setValue(`${safeGet(personagem, 'nivel', 1)} | ${safeGet(personagem, 'pontosDeExperiencia', 0)}`)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('pv')
        .setLabel('PV (Atuais / Máximos / Temporários)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 25/30/5')
        .setValue(`${safeGet(personagem, 'pvAtuais', 0)}/${safeGet(personagem, 'pvMaximos', 0)}/${safeGet(personagem, 'pvTemporarios', 0)}`)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('ca_deslocamento')
        .setLabel('CA | Deslocamento')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 15 | 9m')
        .setValue(`${safeGet(personagem, 'ca', 10)} | ${safeGet(personagem, 'deslocamento', '9m')}`)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('dadosDeVida')
        .setLabel('Dados de Vida Totais')
        .setStyle(TextInputStyle.Short)
        .setValue(safeGet(personagem, 'dadosDeVida', '1d8'))
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('inspiracao')
        .setLabel('Inspiração (sim/não)')
        .setStyle(TextInputStyle.Short)
        .setValue(safeGet(personagem, 'inspiracao', false) ? 'sim' : 'não')
    )
  );

  await interaction.showModal(modal);
  const modalSubmit = await awaitModalSafely(interaction, CONFIG.MODAL_TIMEOUT_SHORT);
  if (!modalSubmit) return;
  await modalSubmit.deferReply({ ephemeral: true });

  const [nivelStr, xpStr] = modalSubmit.fields.getTextInputValue('nivel_xp').split('|');
  const [pvAtuais, pvMaximos, pvTemporarios] = modalSubmit.fields.getTextInputValue('pv').split('/').map(x => parseInt(x.trim()) || 0);
  const [caStr, deslocamento] = modalSubmit.fields.getTextInputValue('ca_deslocamento').split('|').map(s => s.trim());
  const inspiracao = modalSubmit.fields.getTextInputValue('inspiracao').toLowerCase().trim() === 'sim';

  const updates = {
    nivel: parseInt(nivelStr) || 1,
    pontosDeExperiencia: parseInt(xpStr) || 0,
    pvAtuais, pvMaximos, pvTemporarios,
    ca: parseInt(caStr) || 10,
    deslocamento,
    dadosDeVida: modalSubmit.fields.getTextInputValue('dadosDeVida').trim(),
    inspiracao
  };

  await updatePersonagem(interaction.guild.id, interaction.user.id, updates);
  await reply.success(modalSubmit, 'Status Atualizado!', `Status de **${personagem.nome}** atualizado com sucesso.`);
  log.info(`${interaction.user.tag} atualizou status de ${personagem.nome}`);
}
