import { reply } from '#responses/replies';
import { handleCommandError } from '#utils/errorHandler';
import log from '#utils/logger';
import api from '#utils/api';
import { validatePersonagem } from './utils.js';
import {
  handleEditBasico,
  handleEditStatus,
  handleEditAtributos,
  handleEditPersonalidade,
  handleEditAparencia,
  handleEditHistoria,
  handleEditProficiencias,
  handleEditMagia
} from './handlers/index.js';

export async function handleEditarFicha(interaction, userId, guildId, subcomando) {
  try {
    if (!interaction || !userId || !guildId || !subcomando) {
      log.error('Parâmetros inválidos');
      return await reply.error(interaction, 'Erro de Validação', 'Parâmetros inválidos.');
    }

    let personagem;
    try {
      const res = await api.get(`/personagens/${guildId}/${userId}`);
      personagem = res.data;
    } catch (e) {
      if (e.response?.status === 404)
        return await reply.error(interaction, 'Ficha Não Encontrada', 'Use `/ficha criar` para criar uma.');
      throw e;
    }

    if (!validatePersonagem(personagem))
      return await reply.error(interaction, 'Erro na Ficha', 'Ficha incompleta ou corrompida.');

    const handlers = {
      basico: handleEditBasico,
      status: handleEditStatus,
      atributos: handleEditAtributos,
      personalidade: handleEditPersonalidade,
      aparencia: handleEditAparencia,
      historia: handleEditHistoria,
      proficiencias: handleEditProficiencias,
      magia: handleEditMagia
    };

    const handler = handlers[subcomando];
    if (!handler)
      return await reply.error(interaction, 'Subcomando Inválido', `\`${subcomando}\` não reconhecido.`);

    await handler(interaction, personagem);
  } catch (error) {
    await handleCommandError(error, interaction);
  }
}
