import { SlashCommandBuilder, PermissionFlagsBits, UserFlags } from 'discord.js';
import { reply } from '#responses/replies';
import { customEmbed } from '#responses/embeds';
import { handleCommandError } from '#utils/errorHandler';
import log from '#utils/logger';

export const data = new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Exibe informações detalhadas sobre um usuário')
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('O usuário para ver informações (deixe vazio para ver as suas)')
            .setRequired(false))
    .addBooleanOption(option =>
        option.setName('privado')
            .setDescription('Mostrar apenas para você?')
            .setRequired(false))
    .setDMPermission(false);

export const cooldown = 5;

export const permissions = {
    bot: [PermissionFlagsBits.EmbedLinks],
};

/**
 * Obtém badges do usuário
 */
function getUserBadges(user) {
    if (!user.flags) return [];

    const badgeMap = {
        [UserFlags.Staff]: '<:staff:123> Discord Staff',
        [UserFlags.Partner]: '<:partner:123> Parceiro',
        [UserFlags.Hypesquad]: '<:hypesquad:123> HypeSquad Events',
        [UserFlags.BugHunterLevel1]: '<:bughunter1:123> Bug Hunter Nível 1',
        [UserFlags.BugHunterLevel2]: '<:bughunter2:123> Bug Hunter Nível 2',
        [UserFlags.HypeSquadOnlineHouse1]: '<:bravery:123> HypeSquad Bravery',
        [UserFlags.HypeSquadOnlineHouse2]: '<:brilliance:123> HypeSquad Brilliance',
        [UserFlags.HypeSquadOnlineHouse3]: '<:balance:123> HypeSquad Balance',
        [UserFlags.PremiumEarlySupporter]: '<:earlysupporter:123> Early Supporter',
        [UserFlags.VerifiedDeveloper]: '<:developer:123> Desenvolvedor Verificado',
        [UserFlags.CertifiedModerator]: '<:moderator:123> Moderador Certificado',
        [UserFlags.ActiveDeveloper]: '<:activedev:123> Desenvolvedor Ativo'
    };

    const badges = [];
    for (const [flag, badge] of Object.entries(badgeMap)) {
        if (user.flags.has(flag)) {
            badges.push(badge);
        }
    }

    // Adiciona badge de bot se for bot
    if (user.bot) {
        badges.push(user.flags.has(UserFlags.VerifiedBot) ? '✅ Bot Verificado' : '🤖 Bot');
    }

    return badges;
}

/**
 * Obtém status de presença do membro
 */
function getPresenceStatus(member) {
    if (!member.presence) return { emoji: '⚫', text: 'Offline/Invisível' };

    const statusMap = {
        online: { emoji: '🟢', text: 'Online' },
        idle: { emoji: '🟡', text: 'Ausente' },
        dnd: { emoji: '🔴', text: 'Não Perturbe' },
        offline: { emoji: '⚫', text: 'Offline' }
    };

    return statusMap[member.presence.status] || statusMap.offline;
}

/**
 * Obtém atividades do membro
 */
function getActivities(member) {
    if (!member.presence || !member.presence.activities || member.presence.activities.length === 0) {
        return 'Nenhuma atividade';
    }

    return member.presence.activities
        .map(activity => {
            const type = ['🎮 Jogando', '🎵 Ouvindo', '📺 Assistindo', '🎙️ Transmitindo', '🎯 Personalizado', '🎭 Competindo'][activity.type] || '❓';
            return `${type} **${activity.name}**${activity.details ? `\n${activity.details}` : ''}`;
        })
        .join('\n');
}

export async function execute(interaction) {
    try {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const ephemeral = interaction.options.getBoolean('privado') ?? true;

        await interaction.deferReply({ ephemeral });

        // Busca informações completas do usuário
        let user;
        try {
            user = await interaction.client.users.fetch(targetUser.id, { force: true });
        } catch (error) {
            log.warn('Não foi possível buscar usuário completo:', error);
            user = targetUser;
        }

        // Busca membro do servidor
        let member;
        try {
            member = await interaction.guild.members.fetch(user.id);
        } catch (error) {
            log.warn('Usuário não é membro do servidor:', error);
            return await reply.error(
                interaction,
                'Usuário Não Encontrado',
                'Este usuário não está no servidor atual.'
            );
        }

        // Coleta informações
        const badges = getUserBadges(user);
        const presenceStatus = getPresenceStatus(member);
        const activities = getActivities(member);

        // Cargos
        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, 20); // Limita a 20 cargos

        const roleText = roles.length > 0 ? roles.join(', ') : 'Nenhum cargo';
        const moreRoles = member.roles.cache.size - 1 > 20 ? `\n... e mais ${member.roles.cache.size - 21} cargos` : '';

        // Permissões chave
        const keyPermissions = [];
        if (member.permissions.has(PermissionFlagsBits.Administrator)) keyPermissions.push('👑 Administrador');
        if (member.permissions.has(PermissionFlagsBits.ManageGuild)) keyPermissions.push('⚙️ Gerenciar Servidor');
        if (member.permissions.has(PermissionFlagsBits.ManageRoles)) keyPermissions.push('🎭 Gerenciar Cargos');
        if (member.permissions.has(PermissionFlagsBits.ManageChannels)) keyPermissions.push('📝 Gerenciar Canais');
        if (member.permissions.has(PermissionFlagsBits.KickMembers)) keyPermissions.push('👢 Expulsar Membros');
        if (member.permissions.has(PermissionFlagsBits.BanMembers)) keyPermissions.push('🔨 Banir Membros');
        if (member.permissions.has(PermissionFlagsBits.ModerateMembers)) keyPermissions.push('⏰ Moderar Membros');

        // Datas importantes
        const accountAge = Date.now() - user.createdTimestamp;
        const serverAge = member.joinedTimestamp ? Date.now() - member.joinedTimestamp : 0;
        const boostingSince = member.premiumSinceTimestamp;

        // Cor do embed baseada no cargo mais alto
        const embedColor = member.displayHexColor !== '#000000' ? member.displayHexColor : 0x5865F2;

        const embed = customEmbed({
            color: embedColor,
            author: {
                name: `${user.tag}${user.bot ? ' 🤖' : ''}`,
                iconURL: user.displayAvatarURL({ size: 128 })
            },
            thumbnail: user.displayAvatarURL({ size: 256 }),
            image: user.bannerURL({ size: 1024 }),
            fields: [
                {
                    name: '📋 Informações Básicas',
                    value: [
                        `**ID:** \`${user.id}\``,
                        `**Menção:** ${user}`,
                        `**Apelido:** ${member.nickname || 'Nenhum'}`,
                        `**Bot:** ${user.bot ? 'Sim' : 'Não'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `${presenceStatus.emoji} Status`,
                    value: [
                        `**Presença:** ${presenceStatus.text}`,
                        `**Atividade:**\n${activities}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true
                },
                {
                    name: '📅 Conta Criada',
                    value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(user.createdTimestamp / 1000)}:R>)\n*${Math.floor(accountAge / (1000 * 60 * 60 * 24))} dias atrás*`,
                    inline: true
                },
                {
                    name: '📥 Entrou no Servidor',
                    value: member.joinedTimestamp
                        ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n(<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)\n*${Math.floor(serverAge / (1000 * 60 * 60 * 24))} dias atrás*`
                        : 'Data desconhecida',
                    inline: true
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true
                }
            ],
            footer: {
                text: `Solicitado por ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            },
            timestamp: true
        });

        // Adiciona boost se aplicável
        if (boostingSince) {
            embed.data.fields.push({
                name: '💎 Boost do Servidor',
                value: `<t:${Math.floor(boostingSince / 1000)}:F>\n(<t:${Math.floor(boostingSince / 1000)}:R>)`,
                inline: true
            });
        }

        // Adiciona badges se existirem
        if (badges.length > 0) {
            embed.data.fields.push({
                name: '🏅 Badges',
                value: badges.join('\n'),
                inline: false
            });
        }

        // Adiciona permissões chave se existirem
        if (keyPermissions.length > 0) {
            embed.data.fields.push({
                name: '🔑 Permissões Principais',
                value: keyPermissions.join(', '),
                inline: false
            });
        }

        // Adiciona cargos
        embed.data.fields.push({
            name: `🎭 Cargos [${member.roles.cache.size - 1}]`,
            value: (roleText + moreRoles).substring(0, 1024), // Limita para não exceder limite do Discord
            inline: false
        });

        // Adiciona informações de timeout se aplicável
        if (member.communicationDisabledUntilTimestamp) {
            const timeoutEnd = member.communicationDisabledUntilTimestamp;
            if (timeoutEnd > Date.now()) {
                embed.data.fields.push({
                    name: '⏰ Timeout Ativo',
                    value: `Expira <t:${Math.floor(timeoutEnd / 1000)}:R>`,
                    inline: false
                });
            }
        }

        // Adiciona cor do cargo
        if (member.displayHexColor !== '#000000') {
            embed.data.fields.push({
                name: '🎨 Cor do Cargo',
                value: `\`${member.displayHexColor}\``,
                inline: true
            });
        }

        // Adiciona posição na hierarquia
        const sortedMembers = interaction.guild.members.cache
            .sort((a, b) => b.roles.highest.position - a.roles.highest.position);
        const memberPosition = Array.from(sortedMembers.keys()).indexOf(member.id) + 1;

        embed.data.fields.push({
            name: '📊 Posição na Hierarquia',
            value: `${memberPosition}º de ${interaction.guild.memberCount}`,
            inline: true
        });

        await reply.custom(interaction, { embeds: [embed] });

    } catch (error) {
        await handleCommandError(error, interaction);
    }
}