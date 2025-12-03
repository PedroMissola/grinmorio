const Redis = require('ioredis');

let redisClient;

/**
 * @returns {Redis | null}
 */
function connectRedis() {
  const uri = process.env.REDIS_URI;

  if (!uri) {
    console.error('Erro: Variável de ambiente REDIS_URI não definida. O cache não será usado.');
    return null;
  }

  try {
    redisClient = new Redis(uri);

    redisClient.on('connect', () => {
      console.log('Redis: Conexão estabelecida com sucesso!');
    });

    redisClient.on('error', (err) => {
      console.error('Redis: Erro de conexão:', err.message);
    });
    
    // Testa o PING para verificar a saúde
    redisClient.ping().then(() => {
        console.log('Redis: PING bem-sucedido.');
    }).catch(err => {
        console.error('Redis: Falha no PING inicial:', err.message);
    });

    return redisClient;
  } catch (error) {
    console.error('Redis: Falha ao inicializar cliente Redis:', error.message);
    return null;
  }
}

/**
 * @returns {Redis | null}
 */
function getRedisClient() {
    return redisClient;
}

module.exports = {
  connectRedis,
  getRedisClient,
};