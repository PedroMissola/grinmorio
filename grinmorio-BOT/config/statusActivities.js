import { ActivityType } from 'discord.js';

const statusActivities = [
  { name: 'Use /help para ver os comandos', type: ActivityType.Playing },
  { name: 'servidores com atenção', type: ActivityType.Watching },
  { name: 'as mensagens do servidor', type: ActivityType.Listening },
  { name: 'organizando o servidor', type: ActivityType.Competing },
  { name: 'em vários servidores', type: ActivityType.Playing },
];

export default statusActivities;