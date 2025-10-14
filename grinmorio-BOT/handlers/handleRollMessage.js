import { EmbedBuilder } from 'discord.js';
import api from '../utils/api.js';
import log from '../utils/logger.js';
import { embeds } from '../utils/responses/embeds.js';
import { trackEvent, sendLog } from '../utils/analytics.js';

export default async function handleRollMessage(message) {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();
  const guildId = message.guild.id;
  const userId = message.author.id;
  const username = message.author.username;

  try {
    const { data } = await api.get(`/usuarios/${userId}/status`);
    if (data.isBanned) {
      const banEmbed = embeds.error('Acesso Negado', 'Você está banido de usar o sistema de rolagem.');
      await message.reply({ embeds: [banEmbed] });
      return;
    }
  } catch (error) {
    log.error(`API Error (ban check for text command):`, error.message);
  }

  if (content === 'limpariniciativas') {
    try {
      await api.delete(`/rolagens/iniciativa/${guildId}`);
      const successEmbed = embeds.success('Iniciativa Resetada', 'A ordem de combate foi limpa com sucesso.');
      return await message.reply({ embeds: [successEmbed] });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ocorreu um erro.';
      const errorEmbed = embeds.error('Falha ao Limpar', errorMessage);
      return await message.reply({ embeds: [errorEmbed] });
    }
  }

  if (content === 'listariniciativas') {
    try {
      const { data } = await api.get(`/rolagens/iniciativa/${guildId}`);
      const listaFormatada = data.listaOrdenada.map((item, i) => `${i + 1}º - <@${item.userId}> (**${item.valor}**) - ${item.username}`).join('\n');
      const initiativeEmbed = embeds.info('Ordem de Combate', listaFormatada);
      return await message.reply({ embeds: [initiativeEmbed] });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ocorreu um erro.';
      const errorEmbed = embeds.error('Lista Vazia', errorMessage);
      return await message.reply({ embeds: [errorEmbed] });
    }
  }

  const iniciativaMatch = content.match(/^iniciativa\(([-+]?\d+)\)$/);
  if (iniciativaMatch) {
    try {
      const modificador = parseInt(iniciativaMatch[1]);
      const { data } = await api.post('/rolagens/iniciativa', { guildId, userId, username, modificador });
      const listaFormatada = data.listaOrdenada.map((item, i) => `${i + 1}º - <@${item.userId}> (${item.valor})`).join('\n');
      const embed = new EmbedBuilder()
        .setTitle(`📋 Ordem das Iniciativas`)
        .setDescription(listaFormatada)
        .setColor(0x00b0f4)
        .setFooter({ text: `${username} rolou ${data.rolagem.total} (${data.rolagem.detalhes.join(' ')})` });
      return await message.reply({ embeds: [embed] });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ocorreu um erro ao rolar iniciativa.';
      return await message.reply(errorMessage);
    }
  }

  const rollRegex = /^(\d+#\d*d\d+([+-]\d+)?|((vantagem|desvantagem)([+-]\d{1,3})?|[+-]?\d+d\d+)([+-]\d{1,3}|[+-]\d+d\d+)*)$/;
  if (!rollRegex.test(content)) return;

  try {
    const { data } = await api.post('/rolagens/rolar', { expressao: content, userId, guildId, username });

    const rollEmbed = new EmbedBuilder()
      .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
      .setTitle(`Rolagem: \`${content}\``)
      .setDescription(`**Resultado Final: ${data.total}**`)
      .addFields({ name: 'Detalhes da Rolagem', value: data.detalhes.join('\n') })
      .setColor(0x5865f2)
      .setTimestamp();

    await message.reply({ embeds: [rollEmbed] });
    log.info(`Rolagem de texto "${content}" processada para ${message.author.tag}`);

    trackEvent('TEXT_ROLL_EXECUTED', {
      userId,
      guildId,
      expression: content,
      result: data.total,
    });

  } catch (err) {
    log.error(`API Error (rolagem de texto):`, err);
    const errorMessage = err.response?.data?.message || 'Ocorreu um erro inesperado.';
    const errorEmbed = embeds.error('Falha na Rolagem', errorMessage);
    await message.reply({ embeds: [errorEmbed] });

    sendLog('error', 'Falha ao processar rolagem de texto via API', {
      userId,
      guildId,
      expression: content,
      errorMessage: err.message,
      apiResponse: err.response?.data,
    });
  }
}