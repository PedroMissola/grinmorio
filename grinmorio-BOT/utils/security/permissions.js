import { PermissionFlagsBits } from 'discord.js';
import { reply } from '../responses/replies.js';
import log from '../logger.js';

/**
 * Mapeia permissões para um texto mais amigável em português.
 */
const friendlyPermissionNames = {
  [PermissionFlagsBits.CreateInstantInvite]: '"Criar Convite Instantâneo"',
  [PermissionFlagsBits.KickMembers]: '"Expulsar Membros"',
  [PermissionFlagsBits.BanMembers]: '"Banir Membros"',
  [PermissionFlagsBits.Administrator]: '"Administrador"',
  [PermissionFlagsBits.ManageChannels]: '"Gerenciar Canais"',
  [PermissionFlagsBits.ManageGuild]: '"Gerenciar Servidor"',
  [PermissionFlagsBits.AddReactions]: '"Adicionar Reações"',
  [PermissionFlagsBits.ViewAuditLog]: '"Ver Registro de Auditoria"',
  [PermissionFlagsBits.PrioritySpeaker]: '"Voz Prioritária"',
  [PermissionFlagsBits.Stream]: '"Transmitir"',
  [PermissionFlagsBits.ViewChannel]: '"Ver Canal"',
  [PermissionFlagsBits.SendMessages]: '"Enviar Mensagens"',
  [PermissionFlagsBits.SendTTSMessages]: '"Enviar Mensagens TTS"',
  [PermissionFlagsBits.ManageMessages]: '"Gerenciar Mensagens"',
  [PermissionFlagsBits.EmbedLinks]: '"Inserir Links"',
  [PermissionFlagsBits.AttachFiles]: '"Anexar Arquivos"',
  [PermissionFlagsBits.ReadMessageHistory]: '"Ler Histórico de Mensagens"',
  [PermissionFlagsBits.MentionEveryone]: '"Mencionar Everyone"',
  [PermissionFlagsBits.UseExternalEmojis]: '"Usar Emojis Externos"',
  [PermissionFlagsBits.ViewGuildInsights]: '"Ver Insights do Servidor"',
  [PermissionFlagsBits.Connect]: '"Conectar"',
  [PermissionFlagsBits.Speak]: '"Falar"',
  [PermissionFlagsBits.MuteMembers]: '"Silenciar Membros"',
  [PermissionFlagsBits.DeafenMembers]: '"Ensurdecer Membros"',
  [PermissionFlagsBits.MoveMembers]: '"Mover Membros"',
  [PermissionFlagsBits.UseVAD]: '"Usar Detecção de Voz"',
  [PermissionFlagsBits.ChangeNickname]: '"Mudar Apelido"',
  [PermissionFlagsBits.ManageNicknames]: '"Gerenciar Apelidos"',
  [PermissionFlagsBits.ManageRoles]: '"Gerenciar Cargos"',
  [PermissionFlagsBits.ManageWebhooks]: '"Gerenciar Webhooks"',
  [PermissionFlagsBits.ManageEmojisAndStickers]: '"Gerenciar Emojis e Stickers"',
  [PermissionFlagsBits.UseApplicationCommands]: '"Usar Comandos de Aplicação"',
  [PermissionFlagsBits.RequestToSpeak]: '"Pedir para Falar"',
  [PermissionFlagsBits.ManageEvents]: '"Gerenciar Eventos"',
  [PermissionFlagsBits.ManageThreads]: '"Gerenciar Threads"',
  [PermissionFlagsBits.CreatePublicThreads]: '"Criar Threads Públicas"',
  [PermissionFlagsBits.CreatePrivateThreads]: '"Criar Threads Privadas"',
  [PermissionFlagsBits.UseExternalStickers]: '"Usar Stickers Externos"',
  [PermissionFlagsBits.SendMessagesInThreads]: '"Enviar Mensagens em Threads"',
  [PermissionFlagsBits.UseEmbeddedActivities]: '"Usar Atividades Incorporadas"',
  [PermissionFlagsBits.ModerateMembers]: '"Moderar Membros"',
};

/**
 * Converte array de permissões em nomes amigáveis
 * @param {Array<bigint>} permissions Array de permissões
 * @returns {string} Nomes formatados
 */
function getFriendlyNames(permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return 'Nenhuma permissão específica';
  }
  
  try {
    return permissions
      .map(perm => {
        // Tenta buscar o nome amigável
        if (friendlyPermissionNames[perm]) {
          return friendlyPermissionNames[perm];
        }
        
        // Se não encontrar, tenta converter o bigint para string
        try {
          return `"Permissão ${String(perm)}"`;
        } catch {
          return '"Permissão Desconhecida"';
        }
      })
      .join(', ');
  } catch (error) {
    log.error('Erro ao formatar nomes de permissões:', error);
    return 'Permissões não puderam ser listadas';
  }
}

/**
 * Valida se a interaction é utilizável
 * @param {*} interaction Objeto de interação
 * @returns {boolean} True se válida
 */
function isValidInteraction(interaction) {
  if (!interaction || typeof interaction !== 'object') {
    log.error('checkPermissions: interaction inválida ou null');
    return false;
  }
  
  if (!interaction.user || !interaction.user.id) {
    log.error('checkPermissions: interaction sem dados de usuário');
    return false;
  }
  
  return true;
}

/**
 * Verifica se o membro que executou o comando e o bot têm as permissões necessárias.
 * Envia uma resposta de erro automática se a verificação falhar.
 * 
 * @param {import('discord.js').Interaction} interaction A interação do comando.
 * @param {object} permissions O objeto com as permissões a serem verificadas.
 * @param {Array<bigint>} [permissions.user] Permissões que o usuário precisa ter.
 * @param {Array<bigint>} [permissions.bot] Permissões que o bot precisa ter no canal.
 * @returns {Promise<boolean>} Retorna `true` se todas as permissões forem atendidas, `false` caso contrário.
 */
export async function checkPermissions(interaction, permissions = {}) {
  // Validação da interaction
  if (!isValidInteraction(interaction)) {
    return false;
  }
  
  // Extrai e valida as permissões
  let userPerms = [];
  let botPerms = [];
  
  try {
    if (permissions && typeof permissions === 'object') {
      userPerms = Array.isArray(permissions.user) ? permissions.user : [];
      botPerms = Array.isArray(permissions.bot) ? permissions.bot : [];
    }
  } catch (error) {
    log.error('Erro ao processar objeto de permissões:', error);
    return true; // Falha segura: permite o comando passar
  }
  
  // Verifica se o comando foi usado em uma DM, onde não há permissões de servidor
  try {
    if (!interaction.inGuild()) {
      log.warn(`Verificação de permissão pulada para o comando /${interaction.commandName || 'DESCONHECIDO'} (executado em DM).`);
      return true;
    }
  } catch (error) {
    log.error('Erro ao verificar se está em guild:', error);
    return true; // Falha segura
  }

  // Validações de segurança adicionais
  if (!interaction.guild) {
    log.warn('Guild não está disponível na interaction');
    return true; // Falha segura
  }
  
  if (!interaction.member) {
    log.warn('Member não está disponível na interaction');
    return true; // Falha segura
  }

  // 1. Verifica as permissões do USUÁRIO
  if (userPerms.length > 0) {
    try {
      // Verifica se o membro tem o objeto permissions
      if (!interaction.member.permissions) {
        log.warn('interaction.member.permissions não está disponível');
        return true; // Falha segura
      }
      
      // Verifica se tem a função has
      if (typeof interaction.member.permissions.has !== 'function') {
        log.warn('interaction.member.permissions.has não é uma função');
        return true; // Falha segura
      }
      
      // Realiza a verificação
      if (!interaction.member.permissions.has(userPerms)) {
        const neededPerms = getFriendlyNames(userPerms);
        const userTag = interaction.user.tag || `ID:${interaction.user.id}`;
        const commandName = interaction.commandName || 'DESCONHECIDO';
        
        log.warn(`Usuário ${userTag} tentou usar /${commandName} sem a(s) permissão(ões): ${neededPerms}`);
        
        try {
          await reply.error(
            interaction,
            'Acesso Negado',
            `Você precisa da(s) seguinte(s) permissão(ões) para usar este comando: ${neededPerms}.`
          );
        } catch (replyError) {
          log.error('Erro ao enviar mensagem de permissão negada:', replyError);
        }
        
        return false;
      }
    } catch (error) {
      log.error('Erro ao verificar permissões do usuário:', error);
      return true; // Falha segura
    }
  }

  // 2. Verifica as permissões do BOT
  if (botPerms.length > 0) {
    try {
      // Verifica se guild.members existe
      if (!interaction.guild.members) {
        log.warn('interaction.guild.members não está disponível');
        return true; // Falha segura
      }
      
      // Verifica se guild.members.me existe
      if (!interaction.guild.members.me) {
        log.warn('interaction.guild.members.me não está disponível');
        return true; // Falha segura
      }
      
      // Verifica se o bot tem o objeto permissions
      if (!interaction.guild.members.me.permissions) {
        log.warn('Bot permissions não está disponível');
        return true; // Falha segura
      }
      
      // Verifica se tem a função has
      if (typeof interaction.guild.members.me.permissions.has !== 'function') {
        log.warn('Bot permissions.has não é uma função');
        return true; // Falha segura
      }
      
      // Realiza a verificação
      if (!interaction.guild.members.me.permissions.has(botPerms)) {
        const neededPerms = getFriendlyNames(botPerms);
        const commandName = interaction.commandName || 'DESCONHECIDO';
        
        log.error(`O Bot não pôde executar /${commandName} por falta da(s) permissão(ões): ${neededPerms}`);
        
        try {
          await reply.error(
            interaction,
            'Eu Não Consigo Fazer Isso!',
            `Preciso da(s) seguinte(s) permissão(ões) para executar este comando: ${neededPerms}.\n\nPor favor, peça a um administrador para me conceder essas permissões.`
          );
        } catch (replyError) {
          log.error('Erro ao enviar mensagem de falta de permissão do bot:', replyError);
        }
        
        return false;
      }
    } catch (error) {
      log.error('Erro ao verificar permissões do bot:', error);
      return true; // Falha segura
    }
  }
  
  // 3. Se todas as verificações passaram
  return true;
}

/**
 * Verifica se o bot tem uma permissão específica em um canal
 * @param {import('discord.js').GuildChannel} channel Canal a verificar
 * @param {bigint} permission Permissão a verificar
 * @returns {boolean} True se tem a permissão
 */
export function botHasPermissionInChannel(channel, permission) {
  try {
    if (!channel || !channel.guild) {
      return false;
    }
    
    const botMember = channel.guild.members.me;
    if (!botMember) {
      return false;
    }
    
    return channel.permissionsFor(botMember)?.has(permission) ?? false;
  } catch (error) {
    log.error('Erro ao verificar permissão do bot no canal:', error);
    return false;
  }
}

/**
 * Verifica se um membro tem uma permissão específica
 * @param {import('discord.js').GuildMember} member Membro a verificar
 * @param {bigint} permission Permissão a verificar
 * @returns {boolean} True se tem a permissão
 */
export function memberHasPermission(member, permission) {
  try {
    if (!member || !member.permissions) {
      return false;
    }
    
    return member.permissions.has(permission);
  } catch (error) {
    log.error('Erro ao verificar permissão do membro:', error);
    return false;
  }
}