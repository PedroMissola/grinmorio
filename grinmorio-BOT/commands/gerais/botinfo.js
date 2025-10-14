import { SlashCommandBuilder, PermissionFlagsBits, version as djsVersion } from 'discord.js';
import { reply } from '#responses/replies';
import { customEmbed } from '#responses/embeds';
import { handleCommandError } from '#utils/errorHandler';
import log from '#utils/logger';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega versão do bot de forma segura
let botVersion = 'Desconhecida';
try {
    const packageJson = require(path.join(__dirname, '../../package.json'));
    botVersion = packageJson.version || 'Desconhecida';
} catch (error) {
    log.warn('Não foi possível carregar versão do bot:', error.message);
}

export const data = new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Exibe informações detalhadas e estatísticas do bot')
    .addBooleanOption(option =>
        option.setName('privado')
            .setDescription('Mostrar apenas para você?')
            .setRequired(false));

export const cooldown = 5;

export const permissions = {
    bot: [PermissionFlagsBits.EmbedLinks],
};

/**
 * Formata o tempo de uptime de forma legível
 */
function formatUptime(uptimeSeconds) {
    if (!uptimeSeconds || uptimeSeconds < 0) return '0s';

    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
}

/**
 * Formata bytes para formato legível
 */
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Calcula uso de CPU de forma segura
 */
function getCPUUsage() {
    try {
        const cpus = os.cpus();
        if (!Array.isArray(cpus) || cpus.length === 0) return 'N/A';

        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = 100 - (100 * idle / total);

        return `${usage.toFixed(1)}%`;
    } catch (error) {
        log.error('Erro ao calcular uso de CPU:', error);
        return 'N/A';
    }
}

/**
 * Obtém informações de latência
 */
function getLatencyInfo(client) {
    try {
        const wsLatency = client.ws.ping;

        let latencyEmoji = '🟢';
        let latencyStatus = 'Excelente';

        if (wsLatency > 200) {
            latencyEmoji = '🟡';
            latencyStatus = 'Moderado';
        }
        if (wsLatency > 500) {
            latencyEmoji = '🔴';
            latencyStatus = 'Alto';
        }
        if (wsLatency < 0) {
            latencyEmoji = '⚫';
            latencyStatus = 'Medindo...';
        }

        return {
            ping: wsLatency > 0 ? `${wsLatency}ms` : 'Medindo...',
            emoji: latencyEmoji,
            status: latencyStatus
        };
    } catch (error) {
        log.error('Erro ao obter latência:', error);
        return {
            ping: 'N/A',
            emoji: '⚫',
            status: 'Desconhecido'
        };
    }
}

export async function execute(interaction) {
    try {
        const ephemeral = interaction.options.getBoolean('privado') ?? true;
        await interaction.deferReply({ ephemeral });

        const client = interaction.client;

        // Coleta estatísticas de forma segura
        const guilds = client.guilds.cache.size || 0;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => {
            return acc + (guild.memberCount || 0);
        }, 0);
        const channels = client.channels.cache.size || 0;
        const commands = client.commands?.size || 0;

        // Informações de memória
        const memUsage = process.memoryUsage();
        const memHeap = formatBytes(memUsage.heapUsed);
        const memTotal = formatBytes(memUsage.heapTotal);
        const memRSS = formatBytes(memUsage.rss);

        // Informações do sistema
        const platform = os.platform();
        const arch = os.arch();
        const cpuUsage = getCPUUsage();
        const totalMemory = formatBytes(os.totalmem());
        const freeMemory = formatBytes(os.freemem());

        // Latência
        const latency = getLatencyInfo(client);

        // Uptime
        const botUptime = formatUptime(process.uptime());
        const systemUptime = formatUptime(os.uptime());

        const embed = customEmbed({
            color: 0x5865F2,
            title: `📊 ${client.user?.username || 'Bot'} - Informações Detalhadas`,
            thumbnail: client.user?.displayAvatarURL({ size: 256 }),
            fields: [
                {
                    name: '📈 Estatísticas Gerais',
                    value: [
                        `**Servidores:** \`${guilds.toLocaleString('pt-BR')}\``,
                        `**Usuários:** \`${totalUsers.toLocaleString('pt-BR')}\``,
                        `**Canais:** \`${channels.toLocaleString('pt-BR')}\``,
                        `**Comandos:** \`${commands}\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `${latency.emoji} Conectividade`,
                    value: [
                        `**WebSocket:** \`${latency.ping}\``,
                        `**Status:** ${latency.status}`,
                        `**Shards:** \`${client.ws.shards.size}\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⏱️ Tempo Online',
                    value: [
                        `**Bot:** \`${botUptime}\``,
                        `**Sistema:** \`${systemUptime}\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💾 Uso de Memória',
                    value: [
                        `**Heap:** \`${memHeap}\` / \`${memTotal}\``,
                        `**RSS:** \`${memRSS}\``,
                        `**Sistema:** \`${freeMemory}\` livre de \`${totalMemory}\``
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚙️ Informações Técnicas',
                    value: [
                        `**Versão Bot:** \`v${botVersion}\``,
                        `**Discord.js:** \`v${djsVersion}\``,
                        `**Node.js:** \`${process.version}\``,
                        `**Plataforma:** \`${platform} (${arch})\``,
                        `**CPU:** \`${cpuUsage}\``
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔧 Configurações',
                    value: [
                        `**Modo:** \`${process.env.NODE_ENV || 'development'}\``,
                        `**PID:** \`${process.pid}\``,
                        `**Argumentos:** \`${process.argv.length}\``
                    ].join('\n'),
                    inline: false
                }
            ],
            footer: {
                text: `Solicitado por ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            },
            timestamp: true,
        });

        await reply.custom(interaction, { embeds: [embed] });

    } catch (error) {
        await handleCommandError(error, interaction);
    }
}