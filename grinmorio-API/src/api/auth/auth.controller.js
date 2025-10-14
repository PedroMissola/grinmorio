import { authService } from './auth.service.js';
import logger from '../../utils/logger.js';

export const authController = {
  async handleRegister(req, res) {
    try {
      const { username, password, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Nome de utilizador e palavra-passe são obrigatórios.' });
      }
      
      const newUser = await authService.register(username, password, role);
      res.status(201).json({ message: 'Utilizador registado com sucesso!', user: newUser });
    } catch (error) {
      logger.error('Erro no registo:', error.message);
      res.status(error.message.includes('já está em uso') ? 409 : 500).json({ message: error.message });
    }
  },

  async handleLogin(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Nome de utilizador e palavra-passe são obrigatórios.' });
      }
      const result = await authService.login(username, password);
      res.status(200).json(result);
    } catch (error) {
      logger.warn(`Tentativa de login falhada para '${req.body.username}'`);
      res.status(401).json({ message: error.message });
    }
  },
};