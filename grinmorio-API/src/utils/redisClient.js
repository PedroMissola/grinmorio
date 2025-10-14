// src/utils/redisClient.js
import { createClient } from 'redis';
import logger from './logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

const redisClient = createClient({ url: redisUrl });

redisClient.on('connect', () => logger.success('✅ Conectado ao Redis!'));
redisClient.on('error', (err) => logger.error('❌ Erro de conexão com o Redis:', err));

// Não conectamos aqui, vamos conectar no server.js para garantir a ordem de inicialização.

export default redisClient;