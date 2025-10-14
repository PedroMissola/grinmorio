import { getGuildsCollection } from '../../utils/database.js';
import redisClient from '../../utils/redisClient.js';

// Define as configurações padrão para um novo servidor
const DEFAULT_SETTINGS = {
  welcomeChannelId: null,
  logChannelId: null,
  language: 'pt-BR',
};

export const guildsService = {
  async getSettings(guildId) {
    const cacheKey = `guild:${guildId}:settings`;

    // 1. Tenta buscar do cache Redis
    const cachedSettings = await redisClient.get(cacheKey);
    if (cachedSettings) {
      return JSON.parse(cachedSettings);
    }

    // 2. Se não encontrar no cache, busca no MongoDB
    const collection = getGuildsCollection();
    const guildConfig = await collection.findOne({ _id: guildId });

    // Mescla as configurações salvas com as padrões para garantir que todos os campos existam
    const settings = { ...DEFAULT_SETTINGS, ...(guildConfig?.settings || {}) };

    // 3. Salva no Redis antes de retornar para acelerar futuras consultas
    await redisClient.set(cacheKey, JSON.stringify(settings), { EX: 3600 }); // Cache por 1 hora

    return settings;
  },

  async updateSettings(guildId, newSettings) {
    const collection = getGuildsCollection();
    
    // Busca as configurações atuais para mesclar com as novas
    const currentSettings = await this.getSettings(guildId);
    const updatedSettings = { ...currentSettings, ...newSettings };

    await collection.updateOne(
      { _id: guildId },
      { $set: { settings: updatedSettings, lastUpdated: new Date() } },
      { upsert: true } // Cria o documento se ele não existir
    );
    
    // Invalida o cache para garantir que a próxima leitura pegue os dados atualizados
    const cacheKey = `guild:${guildId}:settings`;
    await redisClient.del(cacheKey);

    return { message: 'Configurações do servidor atualizadas com sucesso.' };
  },
};