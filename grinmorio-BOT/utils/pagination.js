import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import log from './logger.js';
import { errorEmbed } from './responses/embeds.js';

/**
 * @param {*} interaction Interação do Discord
 * @param {*} items Lista de itens
 * @param {*} options Opções de configuração
 * @returns {object|null} Objeto com erro ou null se válido
 */
const validatePaginationParams = (interaction, items, options) => {
  if (!interaction || typeof interaction !== 'object') {
    return { error: 'Interaction inválida ou null' };
  }
  
  if (!interaction.user || !interaction.user.id) {
    return { error: 'Interaction sem dados de usuário' };
  }
  
  if (!Array.isArray(items)) {
    return { error: 'Items deve ser um array' };
  }
  
  if (!options || typeof options !== 'object') {
    return { error: 'Options deve ser um objeto' };
  }
  
  if (typeof options.formatPage !== 'function') {
    return { error: 'formatPage deve ser uma função' };
  }
  
  return null;
};

/**
 * @param {object} options Opções fornecidas
 * @returns {object} Opções sanitizadas
 */
const sanitizeOptions = (options) => {
  const itemsPerPage = parseInt(options.itemsPerPage);
  const idleTimeout = parseInt(options.idleTimeout);
  
  return {
    formatPage: options.formatPage,
    itemsPerPage: (itemsPerPage > 0 && itemsPerPage <= 25) ? itemsPerPage : 10,
    idleTimeout: (idleTimeout > 0 && idleTimeout <= 900000) ? idleTimeout : 180000, // Max 15 min
    ephemeral: Boolean(options.ephemeral),
    noResultsMessage: typeof options.noResultsMessage === 'string' 
      ? options.noResultsMessage 
      : 'Nenhum item encontrado.',
  };
};

/**
 * @param {import('discord.js').Interaction} interaction A interação original do comando.
 * @param {Array<any>} items A lista completa de itens a serem exibidos.
 * @param {object} options Opções para customizar a paginação.
 * @param {function(Array<any>, number, number): EmbedBuilder} options.formatPage Uma função que recebe (itensDaPagina, paginaAtual, totalPaginas) e retorna um EmbedBuilder formatado.
 * @param {number} [options.itemsPerPage=10] O número de itens a serem exibidos por página (1-25).
 * @param {number} [options.idleTimeout=180000] O tempo em milissegundos que os botões ficarão ativos (máx: 15 minutos).
 * @param {boolean} [options.ephemeral=false] Se a resposta deve ser visível apenas para o autor do comando.
 * @param {string} [options.noResultsMessage='Nenhum item encontrado.'] Mensagem a ser exibida se a lista de itens estiver vazia.
 * @returns {Promise<void>}
 */
export async function createPaginatedReply(interaction, items, options = {}) {
  const validationError = validatePaginationParams(interaction, items, options);
  if (validationError) {
    log.error('Erro na validação dos parâmetros de paginação:', validationError.error);
    return;
  }
  
  const {
    formatPage,
    itemsPerPage,
    idleTimeout,
    ephemeral,
    noResultsMessage,
  } = sanitizeOptions(options);

  if (items.length === 0) {
    try {
      const embed = errorEmbed('Lista Vazia', noResultsMessage);
      
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed], components: [] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      log.error('Falha ao enviar mensagem de lista vazia:', error);
    }
    return;
  }

  const totalPages = Math.ceil(items.length / itemsPerPage);
  let currentPage = 0;

  /**
   * @param {number} page Página atual
   * @returns {ActionRowBuilder}
   */
  const createButtons = (page) => {
    try {
      const safePage = Math.max(0, Math.min(page, totalPages - 1));
      
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('◀ Anterior')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(safePage === 0),
        new ButtonBuilder()
          .setCustomId('page_info')
          .setLabel(`${safePage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Próxima ▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(safePage >= totalPages - 1)
      );
    } catch (error) {
      log.error('Erro ao criar botões de paginação:', error);
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('error_prev')
          .setLabel('◀ Anterior')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('error_next')
          .setLabel('Próxima ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }
  };

  /**
   * @param {number} page Página atual
   * @returns {object} Payload para enviar
   */
  const getPagePayload = (page) => {
    try {
      const safePage = Math.max(0, Math.min(page, totalPages - 1));
      
      const start = safePage * itemsPerPage;
      const end = Math.min(start + itemsPerPage, items.length);
      const pageItems = items.slice(start, end);
      
      let embed;
      try {
        embed = formatPage(pageItems, safePage + 1, totalPages);
        
        if (!embed || typeof embed.toJSON !== 'function') {
          throw new Error('formatPage não retornou um EmbedBuilder válido');
        }
      } catch (formatError) {
        log.error('Erro ao formatar página:', formatError);
        // Cria embed de erro como fallback
        embed = errorEmbed(
          'Erro ao Formatar Página', 
          'Houve um problema ao processar os dados desta página.'
        );
      }
      
      return {
        embeds: [embed],
        components: totalPages > 1 ? [createButtons(safePage)] : [],
        fetchReply: true,
        ephemeral,
      };
    } catch (error) {
      log.error('Erro ao criar payload da página:', error);
      // Retorna payload de erro como fallback
      return {
        embeds: [errorEmbed('Erro', 'Não foi possível carregar esta página.')],
        components: [],
        fetchReply: true,
        ephemeral: true,
      };
    }
  };

  // Envia a primeira página como resposta
  let replyMessage;
  try {
    if (interaction.deferred || interaction.replied) {
      replyMessage = await interaction.editReply(getPagePayload(currentPage));
    } else {
      replyMessage = await interaction.reply(getPagePayload(currentPage));
    }
    
    // Valida se obteve uma mensagem válida
    if (!replyMessage || typeof replyMessage.createMessageComponentCollector !== 'function') {
      throw new Error('Não foi possível obter uma mensagem válida da resposta');
    }
  } catch (error) {
    log.error('Falha ao enviar a resposta paginada inicial:', error);
    return;
  }
  
  // Se houver apenas uma página, não precisa de coletor
  if (totalPages <= 1) {
    return;
  }
  
  // Cria o coletor de interações para os botões
  let collector;
  try {
    collector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: i => {
        // Aceita apenas interações do usuário original
        const isOriginalUser = i.user.id === interaction.user.id;
        
        // Se não for o usuário original, responde com mensagem ephemeral
        if (!isOriginalUser) {
          i.reply({ 
            content: 'Apenas quem executou o comando pode usar estes botões.', 
            ephemeral: true 
          }).catch(() => {});
        }
        
        return isOriginalUser;
      },
      time: idleTimeout,
    });
  } catch (error) {
    log.error('Falha ao criar coletor de componentes:', error);
    return;
  }

  // Handler para coleta de interações dos botões
  collector.on('collect', async (i) => {
    try {
      // Validação adicional de segurança
      if (!i || !i.customId) {
        log.warn('Interação de botão inválida recebida');
        return;
      }
      
      // Atualiza a página com base no botão clicado
      if (i.customId === 'prev_page' && currentPage > 0) {
        currentPage--;
      } else if (i.customId === 'next_page' && currentPage < totalPages - 1) {
        currentPage++;
      } else {
        // Botão não reconhecido ou página já está no limite
        await i.deferUpdate().catch(() => {});
        return;
      }
      
      // Atualiza a mensagem com a nova página
      await i.update(getPagePayload(currentPage));
    } catch (error) {
      log.error('Falha ao atualizar a página na paginação:', error);
      
      // Tenta responder com mensagem de erro
      try {
        if (!i.replied && !i.deferred) {
          await i.reply({
            content: 'Erro ao mudar de página. Tente novamente.',
            ephemeral: true
          });
        }
      } catch (replyError) {
        log.error('Não foi possível responder ao erro de paginação:', replyError);
      }
    }
  });

  // Handler para quando o coletor termina (timeout)
  collector.on('end', async (collected, reason) => {
    try {
      log.info(`Coletor de paginação finalizado. Motivo: ${reason}. Interações coletadas: ${collected.size}`);
      
      // Remove os botões da mensagem
      await interaction.editReply({ components: [] });
    } catch (error) {
      // Ignora erros comuns ao remover botões
      if (error.code === 10008) {
        // Mensagem foi deletada
        log.info('Mensagem de paginação foi deletada antes de remover os botões');
      } else if (error.code === 50027) {
        // Invalid Webhook Token
        log.warn('Token de webhook inválido ao tentar remover botões');
      } else if (error.message?.includes('Unknown Message')) {
        // Mensagem desconhecida
        log.info('Mensagem de paginação não existe mais');
      } else {
        log.error('Falha ao remover botões da paginação:', error);
      }
    }
  });

  // Handler para erros no coletor
  collector.on('error', (error) => {
    log.error('Erro no coletor de paginação:', error);
  });
}

/**
 * Cria uma paginação simplificada apenas com texto
 * Útil para quando não se quer usar embeds
 * 
 * @param {import('discord.js').Interaction} interaction A interação original
 * @param {Array<string>} pages Array de strings, cada uma sendo uma página
 * @param {object} options Opções adicionais
 * @returns {Promise<void>}
 */
export async function createSimplePaginatedReply(interaction, pages, options = {}) {
  // Validação
  if (!Array.isArray(pages) || pages.length === 0) {
    log.error('createSimplePaginatedReply: pages deve ser um array não vazio');
    return;
  }
  
  const idleTimeout = parseInt(options.idleTimeout) || 180000;
  const ephemeral = Boolean(options.ephemeral);
  
  let currentPage = 0;
  const totalPages = pages.length;
  
  const createButtons = (page) => {
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('simple_prev')
        .setLabel('◀')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(safePage === 0),
      new ButtonBuilder()
        .setCustomId('simple_info')
        .setLabel(`${safePage + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('simple_next')
        .setLabel('▶')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(safePage >= totalPages - 1)
    );
  };
  
  const getPageContent = (page) => {
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const content = String(pages[safePage]).substring(0, 2000); // Limite do Discord
    
    return {
      content,
      components: totalPages > 1 ? [createButtons(safePage)] : [],
      fetchReply: true,
      ephemeral,
    };
  };
  
  try {
    let replyMessage;
    
    if (interaction.deferred || interaction.replied) {
      replyMessage = await interaction.editReply(getPageContent(currentPage));
    } else {
      replyMessage = await interaction.reply(getPageContent(currentPage));
    }
    
    if (totalPages <= 1) return;
    
    const collector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: i => i.user.id === interaction.user.id,
      time: idleTimeout,
    });
    
    collector.on('collect', async (i) => {
      try {
        if (i.customId === 'simple_prev' && currentPage > 0) {
          currentPage--;
        } else if (i.customId === 'simple_next' && currentPage < totalPages - 1) {
          currentPage++;
        } else {
          await i.deferUpdate().catch(() => {});
          return;
        }
        
        await i.update(getPageContent(currentPage));
      } catch (error) {
        log.error('Erro ao atualizar paginação simples:', error);
      }
    });
    
    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch (error) {
        if (error.code !== 10008 && error.code !== 50027) {
          log.error('Erro ao remover botões da paginação simples:', error);
        }
      }
    });
  } catch (error) {
    log.error('Erro ao criar paginação simples:', error);
  }
}