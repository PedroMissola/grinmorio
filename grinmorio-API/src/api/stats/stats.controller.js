import { statsService } from './stats.service.js';
import logger from '../../utils/logger.js';

export const statsController = {
  async recordEvent(req, res) {
    try {
      const { event, details } = req.body;
      if (!event) {
        return res.status(400).json({ message: 'O campo "event" é obrigatório.' });
      }
      const eventData = { event, details, timestamp: new Date() };
      await statsService.recordEvent(eventData);
      res.status(201).json({ message: 'Evento registrado com sucesso.' });
    } catch (error) {
      logger.error('Erro no controller de stats:', error);
      res.status(500).json({ message: 'Erro interno ao registrar evento.' });
    }
  },

  async getSummary(req, res) {
    try {
      const summary = await statsService.getSummary();
      res.status(200).json(summary);
    } catch (error) {
      logger.error('Erro ao obter resumo de estatísticas:', error);
      res.status(500).json({ message: 'Erro interno ao buscar estatísticas.' });
    }
  }
};