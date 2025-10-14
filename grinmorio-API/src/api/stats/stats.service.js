import { getStatsCollection } from '../../utils/database.js';

export const statsService = {
  /**
   * Salva um novo evento de estatística no banco de dados.
   * @param {object} eventData - Os dados do evento.
   */
  async recordEvent(eventData) {
    const collection = getStatsCollection();
    await collection.insertOne(eventData);
  },

  /**
   * Agrega e retorna um resumo das estatísticas.
   * (Este é um exemplo simples, pode ser expandido com queries mais complexas)
   */
  async getSummary() {
    const collection = getStatsCollection();

    const totalEvents = await collection.countDocuments();
    
    const commandUsage = await collection.aggregate([
      { $match: { event: 'COMMAND_USED' } },
      { $group: { _id: '$details.commandName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    return {
      totalEvents,
      topCommands: commandUsage
    };
  }
};