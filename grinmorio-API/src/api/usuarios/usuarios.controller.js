import { usuariosService } from './usuarios.service.js';
import logger from '../../utils/logger.js';

export const usuariosController = {
  async ban(req, res) {
    try {
      const { userId, reason } = req.body;
      if (!userId) {
        return res.status(400).json({ message: 'O campo userId é obrigatório.' });
      }
      const result = await usuariosService.ban(userId, reason);
      res.status(200).json(result);
    } catch (error) {
      logger.error('Erro no controller de ban:', error);
      res.status(500).json({ message: 'Erro interno ao tentar banir o usuário.' });
    }
  },

  async unban(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: 'O campo userId é obrigatório.' });
      }
      const result = await usuariosService.unban(userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error('Erro no controller de unban:', error);
      // Retorna 404 se o erro for "usuário não encontrado"
      res.status(error.message.includes('não estava banido') ? 404 : 500).json({ message: error.message });
    }
  },

  async getStatus(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ message: 'O parâmetro userId é obrigatório na URL.' });
      }
      const result = await usuariosService.getBanStatus(userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error('Erro no controller de getStatus:', error);
      res.status(500).json({ message: 'Erro interno ao verificar o status do usuário.' });
    }
  },

  async listBanned(req, res) {
    try {
      const result = await usuariosService.listBannedUsers();
      res.status(200).json(result);
    } catch (error) {
      logger.error('Erro no controller de listBanned:', error);
      res.status(500).json({ message: 'Erro interno ao listar usuários banidos.' });
    }
  }
};
