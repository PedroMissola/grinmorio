import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger.js';

import rolagensRoutes from './api/rolagens/rolagens.routes.js';
import usuariosRoutes from './api/usuarios/usuarios.routes.js';
import personagensRoutes from './api/personagens/personagens.routes.js';
import logsRoutes from './api/logs/logs.routes.js';
import guildsRoutes from './api/guilds/guilds.routes.js';
import statsRoutes from './api/stats/stats.routes.js';
import authRoutes from './api/auth/auth.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Requisição recebida: ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'online', timestamp: new Date() });
});

app.use('/api/rolagens', rolagensRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/personagens', personagensRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/guilds', guildsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint não encontrado.' });
});

app.use((error, req, res, next) => {
  logger.error('ERRO INESPERADO NA APLICAÇÃO:', error);
  res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
});

export default app;

