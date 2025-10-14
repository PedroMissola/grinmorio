import { EmbedBuilder } from 'discord.js';

const COLORS = {
  success: '#28a745',
  error: '#dc3545',
  info: '#0d6efd',
  warn: '#ffc107'
};

// Limites do Discord para embeds
const LIMITS = {
  TITLE: 256,
  DESCRIPTION: 4096,
  FIELD_NAME: 256,
  FIELD_VALUE: 1024,
  FOOTER: 2048,
  AUTHOR: 256,
  FIELDS_COUNT: 25
};

/**
 * Trunca texto para caber no limite especificado
 * @param {*} text Texto a ser truncado
 * @param {number} maxLength Tamanho máximo
 * @returns {string} Texto truncado
 */
const truncateText = (text, maxLength) => {
  // Converte para string de forma segura
  let str = '';
  
  if (text === null) str = 'null';
  else if (text === undefined) str = 'undefined';
  else if (typeof text === 'string') str = text;
  else if (typeof text === 'number' || typeof text === 'boolean') str = String(text);
  else {
    try {
      str = JSON.stringify(text);
    } catch {
      str = String(text);
    }
  }
  
  // Trunca se necessário
  if (str.length > maxLength) {
    return str.substring(0, maxLength - 3) + '...';
  }
  
  return str;
};

/**
 * Valida e sanitiza título do embed
 * @param {*} title Título do embed
 * @returns {string} Título válido
 */
const sanitizeTitle = (title) => {
  return truncateText(title, LIMITS.TITLE) || 'Sem Título';
};

/**
 * Valida e sanitiza descrição do embed
 * @param {*} description Descrição do embed
 * @returns {string} Descrição válida
 */
const sanitizeDescription = (description) => {
  return truncateText(description, LIMITS.DESCRIPTION) || 'Sem descrição.';
};

/**
 * Cria um embed de sucesso (verde).
 * @param {*} title Título do embed.
 * @param {*} description Descrição do embed.
 * @returns {EmbedBuilder}
 */
export function successEmbed(title, description) {
  try {
    return new EmbedBuilder()
      .setTitle(`✅ ${sanitizeTitle(title)}`)
      .setDescription(sanitizeDescription(description))
      .setColor(COLORS.success)
      .setTimestamp();
  } catch (error) {
    console.error('Erro ao criar successEmbed:', error);
    // Retorna embed de fallback
    return new EmbedBuilder()
      .setTitle('✅ Sucesso')
      .setDescription('Operação concluída.')
      .setColor(COLORS.success);
  }
}

/**
 * Cria um embed de erro (vermelho).
 * @param {*} title Título do embed.
 * @param {*} description Descrição do embed.
 * @returns {EmbedBuilder}
 */
export function errorEmbed(title, description) {
  try {
    return new EmbedBuilder()
      .setTitle(`❌ ${sanitizeTitle(title)}`)
      .setDescription(sanitizeDescription(description))
      .setColor(COLORS.error)
      .setTimestamp();
  } catch (error) {
    console.error('Erro ao criar errorEmbed:', error);
    // Retorna embed de fallback
    return new EmbedBuilder()
      .setTitle('❌ Erro')
      .setDescription('Ocorreu um erro.')
      .setColor(COLORS.error);
  }
}

/**
 * Cria um embed de informação (azul).
 * @param {*} title Título do embed.
 * @param {*} description Descrição do embed.
 * @returns {EmbedBuilder}
 */
export function infoEmbed(title, description) {
  try {
    return new EmbedBuilder()
      .setTitle(`ℹ️ ${sanitizeTitle(title)}`)
      .setDescription(sanitizeDescription(description))
      .setColor(COLORS.info)
      .setTimestamp();
  } catch (error) {
    console.error('Erro ao criar infoEmbed:', error);
    // Retorna embed de fallback
    return new EmbedBuilder()
      .setTitle('ℹ️ Informação')
      .setDescription('Informação disponível.')
      .setColor(COLORS.info);
  }
}

/**
 * Cria um embed de aviso (amarelo).
 * @param {*} title Título do embed.
 * @param {*} description Descrição do embed.
 * @returns {EmbedBuilder}
 */
export function warnEmbed(title, description) {
  try {
    return new EmbedBuilder()
      .setTitle(`⚠️ ${sanitizeTitle(title)}`)
      .setDescription(sanitizeDescription(description))
      .setColor(COLORS.warn)
      .setTimestamp();
  } catch (error) {
    console.error('Erro ao criar warnEmbed:', error);
    // Retorna embed de fallback
    return new EmbedBuilder()
      .setTitle('⚠️ Aviso')
      .setDescription('Atenção necessária.')
      .setColor(COLORS.warn);
  }
}

/**
 * Cria um embed customizado com validação completa
 * @param {object} options Opções do embed
 * @returns {EmbedBuilder}
 */
export function customEmbed(options = {}) {
  try {
    const embed = new EmbedBuilder();
    
    // Define título se fornecido
    if (options.title) {
      embed.setTitle(sanitizeTitle(options.title));
    }
    
    // Define descrição se fornecida
    if (options.description) {
      embed.setDescription(sanitizeDescription(options.description));
    }
    
    // Define cor (usa info como padrão)
    const color = options.color || COLORS.info;
    embed.setColor(color);
    
    // Adiciona fields se fornecidos
    if (Array.isArray(options.fields) && options.fields.length > 0) {
      const validFields = options.fields
        .slice(0, LIMITS.FIELDS_COUNT) // Limita a 25 fields
        .map(field => ({
          name: truncateText(field.name, LIMITS.FIELD_NAME) || 'Campo',
          value: truncateText(field.value, LIMITS.FIELD_VALUE) || 'Sem valor',
          inline: Boolean(field.inline)
        }));
      
      embed.addFields(validFields);
    }
    
    // Adiciona footer se fornecido
    if (options.footer) {
      embed.setFooter({ 
        text: truncateText(options.footer.text, LIMITS.FOOTER) || '',
        iconURL: options.footer.iconURL 
      });
    }
    
    // Adiciona autor se fornecido
    if (options.author) {
      embed.setAuthor({ 
        name: truncateText(options.author.name, LIMITS.AUTHOR) || 'Autor',
        iconURL: options.author.iconURL,
        url: options.author.url
      });
    }
    
    // Adiciona thumbnail se fornecido
    if (options.thumbnail) {
      embed.setThumbnail(options.thumbnail);
    }
    
    // Adiciona imagem se fornecida
    if (options.image) {
      embed.setImage(options.image);
    }
    
    // Adiciona timestamp se solicitado
    if (options.timestamp) {
      embed.setTimestamp();
    }
    
    return embed;
  } catch (error) {
    console.error('Erro ao criar customEmbed:', error);
    // Retorna embed de fallback básico
    return new EmbedBuilder()
      .setTitle('Embed')
      .setDescription('Conteúdo não disponível.')
      .setColor(COLORS.info);
  }
}

export const embeds = {
  success: successEmbed,
  error: errorEmbed,
  info: infoEmbed,
  warn: warnEmbed,
  custom: customEmbed
};
