// src/server.js
import app from './app.js';
import logger from './utils/logger.js';
import { connectToDatabase } from './utils/database.js';
import redisClient from './utils/redisClient.js'; // 1. IMPORTE O CLIENTE REDIS

const PORT = process.env.PORT || 3000;

(async () => {
  await connectToDatabase();
  await redisClient.connect();

  app.listen(PORT, () => {
    logger.success(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`URL base da API: http://localhost:${PORT}/api`);
  });
})();