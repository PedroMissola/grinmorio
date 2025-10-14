import { guildsService } from './guilds.service.js';
import logger from '../../utils/logger.js';

export const guildsController = {
  async getSettings(req, res) {
    try {
      const { guildId } = req.params;
      const settings = await guildsService.getSettings(guildId);
      res.status(200).json(settings);
    } catch (error) {
      logger.error(`Erro ao buscar configurações para o servidor ${req.params.guildId}:`, error);
      res.status(404).json({ message: error.message });
    }
  },

  async updateSettings(req, res) {
    try {
      const { guildId } = req.params;
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ message: 'O corpo da requisição deve conter um objeto "settings".' });
      }
      const result = await guildsService.updateSettings(guildId, settings);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Erro ao atualizar configurações para o servidor ${req.params.guildId}:`, error);
      res.status(500).json({ message: 'Erro interno ao atualizar as configurações.' });
    }
  },
};