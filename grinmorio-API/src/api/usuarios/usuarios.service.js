// src/api/usuarios/usuarios.service.js - Refatorado com Redis

import { getBannedUsersCollection } from '../../utils/database.js';
import logger from '../../utils/logger.js';
import redisClient from '../../utils/redisClient.js'; // 1. IMPORTE O CLIENTE REDIS

export const usuariosService = {
  /**
   * Bane um usuário no MongoDB e invalida o cache do Redis.
   */
  async ban(userId, reason = "Não especificado") {
    const collection = getBannedUsersCollection();
    // 1. Ação de escrita principal no MongoDB
    await collection.updateOne(
      { _id: userId },
      { $set: { banned: true, bannedAt: new Date(), reason: reason } },
      { upsert: true }
    );
    logger.info(`Usuário ${userId} foi banido no DB. Motivo: ${reason}`);

    // 2. Invalida (deleta) as chaves de cache relacionadas a este usuário e à lista geral
    const userCacheKey = `user:ban_status:${userId}`;
    const listCacheKey = 'users:banned_list';
    await redisClient.del(userCacheKey);
    await redisClient.del(listCacheKey);
    logger.info(`Cache para ${userId} e lista de banidos invalidado.`);

    return { message: `Usuário ${userId} banido com sucesso.` };
  },

  /**
   * Desbane um usuário no MongoDB e invalida o cache do Redis.
   */
  async unban(userId) {
    const collection = getBannedUsersCollection();
    const result = await collection.deleteOne({ _id: userId });

    if (result.deletedCount === 0) {
      throw new Error(`Usuário ${userId} não estava banido.`);
    }

    logger.info(`Usuário ${userId} foi desbanido no DB.`);

    // Invalida o cache da mesma forma que no 'ban'
    const userCacheKey = `user:ban_status:${userId}`;
    const listCacheKey = 'users:banned_list';
    await redisClient.del(userCacheKey);
    await redisClient.del(listCacheKey);
    logger.info(`Cache para ${userId} e lista de banidos invalidado.`);

    return { message: `Usuário ${userId} desbanido com sucesso.` };
  },

  /**
   * Verifica o status de banimento de um usuário, com prioridade para o cache do Redis.
   */
  // Em: src/api/usuarios/usuarios.service.js

  async getBanStatus(userId) {
    const cacheKey = `user:ban_status:${userId}`;

    const cachedStatus = await redisClient.get(cacheKey);
    if (cachedStatus !== null) {
      logger.info(`Cache HIT para status de ban do usuário ${userId}`);
      // Esta parte já está correta, pois compara a string 'true'
      return { isBanned: cachedStatus === 'true' };
    }

    logger.info(`Cache MISS para status de ban do usuário ${userId}, buscando no DB...`);
    const collection = getBannedUsersCollection();
    const user = await collection.findOne({ _id: userId });
    const isBanned = !!user && user.banned === true;

    // A CORREÇÃO ESTÁ AQUI: Convertendo o booleano para string antes de salvar
    await redisClient.set(cacheKey, String(isBanned), { EX: 3600 });

    return { isBanned };
  },

  /**
   * Lista todos os usuários banidos, com prioridade para o cache do Redis.
   */
  async listBannedUsers() {
    const cacheKey = 'users:banned_list';

    // 1. Tenta buscar a lista completa do Redis
    const cachedList = await redisClient.get(cacheKey);
    if (cachedList) {
      logger.info('Cache HIT para a lista de banidos.');
      return JSON.parse(cachedList);
    }

    // 2. Se não está no cache, busca no MongoDB
    logger.info('Cache MISS para a lista de banidos, buscando no DB...');
    const collection = getBannedUsersCollection();
    const bannedListFromDB = await collection.find({ banned: true }).toArray();

    const formattedList = bannedListFromDB.map(user => ({
      userId: user._id,
      reason: user.reason || "Não especificado",
      bannedAt: user.bannedAt || new Date()
    }));

    // 3. Salva a lista no Redis (em formato JSON string) para a próxima vez
    await redisClient.set(cacheKey, JSON.stringify(formattedList), { EX: 600 }); // Expira em 10 minutos

    return formattedList;
  }
};