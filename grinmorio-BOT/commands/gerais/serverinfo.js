import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, GuildVerificationLevel, GuildExplicitContentFilter, GuildNSFWLevel } from 'discord.js';
import { reply } from '#responses/replies';
import { customEmbed } from '#responses/embeds';
import { handleCommandError } from '#utils/errorHandler';
import log from '#utils/logger';

export const data = new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Exibe informações detalhadas sobre o servidor atual')
    .setDMPermission(false);

export const cooldown = 10;

export const permissions = {
    bot: [PermissionFlagsBits.EmbedLinks],
};

/**
 * Mapeia níveis de verificação para texto
 */
function getVerificationLevel(level) {
    const levels = {
        [GuildVerificationLevel.None]: '🔓 Nenhuma',
        [GuildVerificationLevel.Low]: '🔒 Baixa',
        [GuildVerificationLevel.Medium]: '🔐 Média',
        [GuildVerificationLevel.High]: '🔒🔒 Alta',
        [GuildVerificationLevel.VeryHigh]: '🔒🔒🔒 Muito Alta'
    };
    return levels[level] || 'Desconhecido';
}

/**
 * Mapeia filtro de conteúdo explícito
 */
function getContentFilter(filter) {
    const filters = {
        [GuildExplicitContentFilter.Disabled]: 'Desabilitado',
        [GuildExplicitContentFilter.MembersWithoutRoles]: 'Membros sem cargo',
        [GuildExplicitContentFilter.AllMembers]: 'Todos os membros'
    };
    return filters[filter] || 'Desconhecido';
}

/**
 * Mapeia nível NSFW
 */
function getNSFWLevel(level) {
    const levels = {
        [GuildNSFWLevel.Default]: 'Padrão',
        [GuildNSFWLevel.Explicit]: 'Explícito',
        [GuildNSFWLevel.Safe]: 'Seguro',
        [GuildNSFWLevel.AgeRestricted]: 'Restrição de Idade'
    };
    return levels[level] || 'Desconhecido';
}

/**
 * Obtém features do servidor traduzidas
 */
function getServerFeatures(features) {
    if (!Array.isArray(features) || features.length === 0) {
        return 'Nenhuma feature especial';
    }

    const featureMap = {
        'ANIMATED_ICON': '🎬 Ícone Animado',
        'BANNER': '🎨 Banner',
        'COMMERCE': '🛒 Comércio',
        'COMMUNITY': '🌐 Comunidade',
        'DISCOVERABLE': '🔍 Descobrível',
        'FEATURABLE': '⭐ Destacável',
        'INVITE_SPLASH': '🖼️ Splash de Convite',
        'MEMBER_VERIFICATION_GATE_ENABLED': '✅ Verificação de Membros',
        'NEWS': '📰 Canais de Notícias',
        'PARTNERED': '🤝 Parceiro',
        'PREVIEW_ENABLED': '👁️ Preview Habilitado',
        'VANITY_URL': '🔗 URL Personalizada',
        'VERIFIED': '✅ Verificado',
        'VIP_REGIONS': '🌟 Regiões VIP',
        'WELCOME_SCREEN_ENABLED': '👋 Tela de Boas-vindas',
        'TICKETED_EVENTS_ENABLED': '🎟️ Eventos com Ingressos',
        'MONETIZATION_ENABLED': '💰 Monetização',
        'MORE_STICKERS': '😀 Mais Stickers',
        'THREE_DAY_THREAD_ARCHIVE': '📝 Arquivo de Thread 3 Dias',
        'SEVEN_DAY_THREAD_ARCHIVE': '📝 Arquivo de Thread 7 Dias',
        'PRIVATE_THREADS': '🔒 Threads Privadas',
        'ROLE_ICONS': '🎭 Ícones de Cargo'
    };

    const mapped = features
        .map(f => featureMap[f] || f)
        .slice(0, 10); // Limita a 10 para não ficar muito grande

    if (features.length > 10) {
        mapped.push(`... e mais ${features.length - 10}`);
    }

    return mapped.join(', ');
}

export async function execute(interaction) {
    try {
        await interaction.deferReply();

        const guild = interaction.guild;

        if (!guild) {
            return await reply.error(interaction, 'Erro', 'Não foi possível obter informações do servidor.');
        }

        // Busca informações adicionais de forma segura
        let owner;
        try {
            owner = await guild.fetchOwner();
        } catch (error) {
            log.warn('Não foi possível buscar dono do servidor:', error);
            owner = { user: { tag: 'Desconhecido', id: guild.ownerId || 'N/A' } };
        }

        // Contagem de canais por tipo
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
        const threads = guild.channels.cache.filter(c => c.isThread()).size;
        const stageChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildStageVoice).size;
        const forumChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildForum).size;

        // Contagem de membros
        const totalMembers = guild.memberCount || guild.members.cache.size;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const humans = totalMembers - bots;

        // Emojis e stickers
        const staticEmojis = guild.emojis.cache.filter(e => !e.animated).size;
        const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
        const totalEmojis = guild.emojis.cache.size;
        const stickers = guild.stickers.cache.size;

        // Boosts
        const boostTier = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount || 0;
        const boostEmoji = boostTier > 0 ? '💎'.repeat(boostTier) : '📦';

        // Segurança
        const verification = getVerificationLevel(guild.verificationLevel);
        const contentFilter = getContentFilter(guild.explicitContentFilter);
        const nsfwLevel = getNSFWLevel(guild.nsfwLevel);

        // Features
        const features = getServerFeatures(guild.features);

        const embed = customEmbed({
            color: 0x5865F2,
            title: `🏰 ${guild.name}`,
            description: guild.description || 'Sem descrição',
            thumbnail: guild.iconURL({ size: 256 }),
            image: guild.bannerURL({ size: 1024 }),
            fields: [
                {
                    name: '👑 Proprietário',
                    value: `${owner.user.tag}\n\`${owner.user.id}\``,
                    inline: true
                },
                {
                    name: '🆔 ID do Servidor',
                    value: `\`${guild.id}\``,
                    inline: true
                },
                {
                    name: '📅 Criado em',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`,
                    inline: true
                },
                {
                    name: `👥 Membros (${totalMembers.toLocaleString('pt-BR')})`,
                    value: [
                        `**Humanos:** \`${humans.toLocaleString('pt-BR')}\``,
                        `**Bots:** \`${bots}\``,
                        `**Online:** \`${guild.approximatePresenceCount || 'N/A'}\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `💬 Canais (${guild.channels.cache.size})`,
                    value: [
                        `📝 Texto: \`${textChannels}\``,
                        `🔊 Voz: \`${voiceChannels}\``,
                        `📁 Categorias: \`${categories}\``,
                        `🧵 Threads: \`${threads}\``,
                        `🎭 Palco: \`${stageChannels}\``,
                        `💬 Fórum: \`${forumChannels}\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `🎭 Cargos`,
                    value: `\`${guild.roles.cache.size}\` cargos`,
                    inline: true
                },
                {
                    name: `${boostEmoji} Boosts`,
                    value: [
                        `**Nível:** \`${boostTier}\``,
                        `**Boosts:** \`${boostCount}\``,
                        `**Boosters:** \`${guild.members.cache.filter(m => m.premiumSince).size}\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '😀 Emojis e Stickers',
                    value: [
                        `**Emojis:** \`${totalEmojis}\` (${staticEmojis} estáticos, ${animatedEmojis} animados)`,
                        `**Stickers:** \`${stickers}\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🔐 Segurança',
                    value: [
                        `**Verificação:** ${verification}`,
                        `**Filtro de Conteúdo:** ${contentFilter}`,
                        `**Nível NSFW:** ${nsfwLevel}`,
                        `**MFA:** ${guild.mfaLevel > 0 ? 'Ativado' : 'Desativado'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⭐ Features',
                    value: features,
                    inline: false
                }
            ],
            footer: {
                text: `Solicitado por ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            },
            timestamp: true
        });

        // Adiciona URL customizada se existir
        if (guild.vanityURLCode) {
            embed.data.fields.push({
                name: '🔗 URL Customizada',
                value: `discord.gg/${guild.vanityURLCode}`,
                inline: false
            });
        }

        await reply.custom(interaction, { embeds: [embed] });

    } catch (error) {
        await handleCommandError(error, interaction);
    }
}