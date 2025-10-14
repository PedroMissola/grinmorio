import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} from 'discord.js';
import log from '#utils/logger';
import { reply } from '#responses/replies';
import { safeGet, awaitModalSafely, updatePersonagem, CONFIG } from '../utils.js';

export async function handleEditAtributos(interaction, personagem) {
  const attr = personagem.atributos || {};
  const modal = new ModalBuilder()
    .setCustomId(`edit_atributos_${interaction.id}`)
    .setTitle('Editar Atributos');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('atributos')
        .setLabel('FOR, DES, CON, INT, SAB, CAR')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 15,14,13,12,10,8')
        .setValue(`${attr.forca || 10},${attr.destreza || 10},${attr.constituicao || 10},${attr.inteligencia || 10},${attr.sabedoria || 10},${attr.carisma || 10}`)
    )
  );

  await interaction.showModal(modal);
  const modalSubmit = await awaitModalSafely(interaction, CONFIG.MODAL_TIMEOUT_SHORT);
  if (!modalSubmit) return;
  await modalSubmit.deferReply({ ephemeral: true });

  const valores = modalSubmit.fields.getTextInputValue('atributos').split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
  if (valores.length !== 6)
    return await reply.error(modalSubmit, 'Formato Inválido', 'Informe 6 valores numéricos separados por vírgula.');

  const updates = {
    atributos: {
      forca: valores[0],
      destreza: valores[1],
      constituicao: valores[2],
      inteligencia: valores[3],
      sabedoria: valores[4],
      carisma: valores[5],
    }
  };

  await updatePersonagem(interaction.guild.id, interaction.user.id, updates);
  await reply.success(modalSubmit, 'Atributos Atualizados!', `Atributos de **${personagem.nome}** atualizados.`);
  log.info(`${interaction.user.tag} atualizou atributos de ${personagem.nome}`);
}
