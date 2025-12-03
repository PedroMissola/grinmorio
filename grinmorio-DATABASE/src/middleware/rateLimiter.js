const { getRedisClient } = require('../config/redis');
const { sendErrorResponse } = require('../utils/errorHandler');

/**
 * @param {number}
 * @param {number}
 * @returns {Function}
 */
const rateLimiter = (limit = 10, windowInSeconds = 60) => {
  return async (req, res, next) => {
    const redis = getRedisClient();

    if (!redis) {
      console.warn('Rate Limiter desabilitado: Redis não está conectado.');
      return next();
    }
    
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const key = `ratelimit:${clientIp}`;
    
    try {

      const [count, ttl] = await redis.multi()
        .incr(key)
        .ttl(key)
        .exec();

      if (ttl === -1) {
        await redis.expire(key, windowInSeconds);
      }

      if (count > limit) {
        const retryAfter = ttl === -1 ? windowInSeconds : ttl;
        res.setHeader('Retry-After', retryAfter);
        return sendErrorResponse(res, 429, 'Limite de Taxa Excedido', `Você só pode fazer ${limit} requisições a cada ${windowInSeconds} segundos.`);
      }

      next();
    } catch (error) {
      console.error('Erro no Rate Limiter:', error);
      next();
    }
  };
};

module.exports = rateLimiter;