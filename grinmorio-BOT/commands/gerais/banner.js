import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { reply } from '../../utils/responses/replies.js';
import { customEmbed } from '../utils/responses/embeds.js';
import { handleCommandError } from '../utils/errorHandler.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('banner')
  .setDescription('Exibe o banner de um usuário (se tiver)')
  .addUserOption(option =>
    option.setName('usuario')
      .setDescription('O usuário para ver o banner')
      .setRequired(false))
  .addBooleanOption(option =>
    option.setName('privado')
      .setDescription('Mostrar apenas para você?')
      .setRequired(false));

export const cooldown = 3;

export const permissions = {
  bot: [PermissionFlagsBits.EmbedLinks],
};

export async function execute(interaction) {
  try {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const ephemeral = interaction.options.getBoolean('privado') ?? false;
    
    await interaction.deferReply({ ephemeral });

    // Busca usuário completo (necessário para ver banner)
    let user;
    try {
      user = await interaction.client.users.fetch(targetUser.id, { force: true });
    } catch (error) {
      return await reply.error(
        interaction,
        'Erro',
        'Não foi possível buscar informações deste usuário.'
      );
    }
    
    // Verifica se tem banner
    if (!user.banner) {
      return await reply.info(
        interaction,
        'Sem Banner',
        `${user.tag} não possui um banner configurado.`
      );
    }
    
    // URLs do banner
    const bannerURL = user.bannerURL({ size: 4096, extension: 'png' });
    const bannerWebP = user.bannerURL({ size: 4096, extension: 'webp' });
    const bannerJPG = user.bannerURL({ size: 4096, extension: 'jpg' });
    const bannerGIF = user.banner?.startsWith('a_')
      ? user.bannerURL({ size: 4096, extension: 'gif' })
      : null;
    
    // Cor do accent (se tiver)
    const accentColor = user.accentColor || 0x5865F2;
    
    const embed = customEmbed({
      color: accentColor,
      title: `🎨 Banner de ${user.tag}`,
      description: user.hexAccentColor 
        ? `**Cor do perfil:** \`${user.hexAccentColor}\``
        : null,
      image: bannerURL,
      footer: { 
        text: `Solicitado por ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      },
      timestamp: true
    });
    
    // Botões para download
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('PNG')
        .setStyle(ButtonStyle.Link)
        .setURL(bannerURL),
      new ButtonBuilder()
        .setLabel('WebP')
        .setStyle(ButtonStyle.Link)
        .setURL(bannerWebP),
      new ButtonBuilder()
        .setLabel('JPG')
        .setStyle(ButtonStyle.Link)
        .setURL(bannerJPG)
    );
    
    if (bannerGIF) {
      buttons.addComponents(
        new ButtonBuilder()
          .setLabel('GIF')
          .setStyle(ButtonStyle.Link)
          .setURL(bannerGIF)
          .setEmoji('✨')
      );
    }

    await reply.custom(interaction, { 
      embeds: [embed], 
      components: [buttons] 
    });
    
  } catch (error) {
    await handleCommandError(error, interaction);
  }
}