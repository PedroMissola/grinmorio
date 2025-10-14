import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { reply } from '#utils/responses/replies';
import { customEmbed } from '#utils/responses/embeds';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica a latência do bot e da API do Discord.');

export const cooldown = 10; // Cooldown de 10 segundos

export const permissions = {
    bot: [PermissionFlagsBits.EmbedLinks],
};

export async function execute(interaction) {
    // Responde inicialmente para medir a latência da API
    const sent = await interaction.reply({ content: 'Pingando...', fetchReply: true, ephemeral: true });

    const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const websocketLatency = Math.round(interaction.client.ws.ping);

    const getStatus = (latency) => {
        if (latency < 150) return '🟢 Excelente';
        if (latency < 250) return '🟡 Bom';
        if (latency < 400) return '🟠 Lento';
        return '🔴 Muito Lento';
    };

    const embed = customEmbed({
        title: '🏓 Pong!',
        color: 0x5865F2,
        fields: [
            { name: '📡 Latência da API', value: `**${apiLatency}ms**\n${getStatus(apiLatency)}`, inline: true },
            { name: '🌐 Latência do WebSocket', value: `**${websocketLatency}ms**\n${getStatus(websocketLatency)}`, inline: true },
        ],
        footer: { text: `Solicitado por ${interaction.user.tag}` },
        timestamp: true
    });

    // Edita a resposta original usando o handler de replies
    await reply.edit(interaction, { content: null, embeds: [embed] });
}