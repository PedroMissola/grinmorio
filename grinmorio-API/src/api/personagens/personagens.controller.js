import { personagensService } from './personagens.service.js';
import logger from '../../utils/logger.js';

/** Lida com a requisição de criação de uma nova ficha. */
export async function create(req, res) {
  try {
    const { userId, guildId, dadosFicha } = req.body;
    if (!userId || !guildId || !dadosFicha) {
      return res.status(400).json({ message: 'Campos obrigatórios: userId, guildId, dadosFicha.' });
    }
    const novaFicha = await personagensService.create(userId, guildId, dadosFicha);
    res.status(201).json(novaFicha);
  } catch (error) {
    logger.error('Erro no controller de criar personagem:', error.message);
    res.status(error.message.includes('já possui') ? 409 : 400).json({ message: error.message });
  }
}

/** Lida com a requisição de busca de uma ficha por ID. */
export async function getById(req, res) {
  try {
    const { userId, guildId } = req.params;
    const personagem = await personagensService.getById(userId, guildId);
    res.status(200).json(personagem);
  } catch (error) {
    logger.error('Erro no controller de buscar personagem:', error.message);
    res.status(404).json({ message: error.message });
  }
}

/** Lida com a requisição de atualização de uma ficha. */
export async function update(req, res) {
    try {
        const { userId, guildId } = req.params;
        const { updates } = req.body;
        if (!updates) {
          return res.status(400).json({ message: 'O corpo da requisição deve conter um objeto "updates".' });
        }
        const result = await personagensService.update(userId, guildId, updates);
        res.status(200).json(result);
    } catch (error) {
        logger.error('Erro no controller de atualizar personagem:', error.message);
        res.status(error.message.includes('não encontrada') ? 404 : 400).json({ message: error.message });
    }
}

/** Lida com a requisição de deleção de uma ficha. */
export async function deleteById(req, res) {
    try {
        const { userId, guildId } = req.params;
        const result = await personagensService.deleteById(userId, guildId);
        res.status(200).json(result);
    } catch (error) {
        logger.error('Erro no controller de deletar personagem:', error.message);
        res.status(404).json({ message: error.message });
    }
}

/** Lida com a requisição de adicionar um item, magia ou feature. */
export async function addItem(req, res) {
    try {
        const { userId, guildId } = req.params;
        const { tipo, nomeItem } = req.body;
        if (!tipo || !nomeItem) {
          return res.status(400).json({ message: 'Campos obrigatórios: tipo, nomeItem.' });
        }
        const result = await personagensService.addItem(userId, guildId, tipo, nomeItem);
        res.status(200).json(result);
    } catch (error) {
        logger.error('Erro no controller de adicionar item:', error.message);
        const status = error.message.includes('não encontrada') ? 404 : error.message.includes('já existe') ? 409 : 400;
        res.status(status).json({ message: error.message });
    }
}

/** Lida com a requisição de gerar um backup em PDF da ficha. */
export async function getCharacterPdf(req, res) {
  try {
    const { guildId, userId } = req.params;
    const personagem = await personagensService.getById(userId, guildId);
    
    const pdfBuffer = await personagensService.generatePdf(personagem);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ficha_${personagem.nome}.pdf"`);
    
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Erro no controller de gerar PDF:', error.message);
    res.status(404).json({ message: error.message });
  }
}