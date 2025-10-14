import { rolagensService } from './rolagens.service.js';
import logger from '../../utils/logger.js';

export const rolagensController = {
  async rolar(req, res) {
    try {
      const { expressao, userId, guildId, username } = req.body;

      if (!expressao || !userId || !guildId || !username) {
        return res.status(400).json({ message: 'Campos obrigatórios ausentes: expressao, userId, guildId, username.' });
      }

      const resultado = await rolagensService.rolarDados(expressao, userId, guildId, username);
      res.status(200).json(resultado);
    } catch (error) {
      logger.error('Erro no controller de rolar dados:', error);
      res.status(400).json({ message: error.message || 'Erro ao processar a rolagem.' });
    }
  },

  async adicionarIniciativa(req, res) {
    try {
      const { modificador, userId, guildId, username } = req.body;

      if (modificador === undefined || !userId || !guildId || !username) {
        return res.status(400).json({ message: 'Campos obrigatórios ausentes: modificador, userId, guildId, username.' });
      }

      const resultado = await rolagensService.rolarIniciativa(modificador, userId, guildId, username);
      res.status(200).json(resultado);
    } catch (error) {
      logger.error('Erro no controller de adicionar iniciativa:', error);
      res.status(500).json({ message: 'Erro interno ao rolar iniciativa.' });
    }
  },

  async obterIniciativas(req, res) {
    try {
      const { guildId } = req.params;
      // Adicionado 'await'
      const resultado = await rolagensService.listarIniciativas(guildId);
      res.status(200).json(resultado);
    } catch (error) {
      logger.warn(`Tentativa de listar iniciativas vazias para o servidor ${req.params.guildId}`);
      res.status(404).json({ message: error.message });
    }
  },

  async limparIniciativas(req, res) {
    try {
      const { guildId } = req.params;
      // Adicionado 'await'
      const resultado = await rolagensService.limparIniciativas(guildId);
      res.status(200).json(resultado);
    } catch (error) {
      logger.error('Erro no controller de limpar iniciativa:', error);
      res.status(500).json({ message: 'Erro interno ao limpar iniciativas.' });
    }
  },

  async setarIniciativa(req, res) {
    try {
      const { guildId, userId, username, valor } = req.body;
      if (!guildId || !userId || !username || valor === undefined) {
        return res.status(400).json({ message: 'Campos obrigatórios: guildId, userId, username, valor.' });
      }
      const resultado = await rolagensService.setarIniciativa(guildId, userId, username, parseInt(valor));
      res.status(200).json(resultado);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async removerIniciativa(req, res) {
    try {
      const { guildId, userId } = req.params;
      const resultado = await rolagensService.removerIniciativa(guildId, userId);
      res.status(200).json(resultado);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async obterEstatisticas(req, res) {
    try {
      const { guildId, userId } = req.params;
      const resultado = await rolagensService.obterEstatisticas(guildId, userId);
      res.status(200).json(resultado);
    } catch (error) {
      logger.error('Erro ao obter estatísticas de rolagem:', error);
      res.status(404).json({ message: error.message });
    }
  },
};
