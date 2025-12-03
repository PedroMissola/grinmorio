import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { reply } from '../../utils/responses/replies.js';
import { customEmbed } from '../utils/responses/embeds.js';
import { handleCommandError } from '../utils/errorHandler.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Exibe o avatar de um usuário em alta qualidade')
  .addUserOption(option =>
    option.setName('usuario')
      .setDescription('O usuário para ver o avatar (deixe vazio para ver o seu)')
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
    const ephemeral = interaction.options.getBoolean('privado') ?? false; // Padrão público para avatares
    
    await interaction.deferReply({ ephemeral });

    // Busca usuário completo para pegar banner/avatar customizado
    let user;
    try {
      user = await interaction.client.users.fetch(targetUser.id, { force: true });
    } catch (error) {
      user = targetUser;
    }
    
    // Busca membro se estiver no servidor (para avatar de servidor)
    let member = null;
    if (interaction.guild) {
      try {
        member = await interaction.guild.members.fetch(user.id);
      } catch (error) {
        // Não é crítico
      }
    }
    
    // URLs dos avatares em diferentes formatos
    const avatarURL = user.displayAvatarURL({ size: 4096, extension: 'png' });
    const avatarWebP = user.displayAvatarURL({ size: 4096, extension: 'webp' });
    const avatarJPG = user.displayAvatarURL({ size: 4096, extension: 'jpg' });
    const avatarGIF = user.avatar?.startsWith('a_') 
      ? user.displayAvatarURL({ size: 4096, extension: 'gif' })
      : null;
    
    // Avatar do servidor (se diferente)
    const guildAvatarURL = member?.avatar 
      ? member.displayAvatarURL({ size: 4096, extension: 'png' })
      : null;
    
    const embed = customEmbed({
      color: member?.displayHexColor !== '#000000' ? member?.displayHexColor : 0x5865F2,
      title: `🖼️ Avatar de ${user.tag}`,
      description: guildAvatarURL 
        ? '**Este usuário tem um avatar diferente neste servidor!**'
        : null,
      image: guildAvatarURL || avatarURL,
      footer: { 
        text: `Solicitado por ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      },
      timestamp: true
    });
    
    // Botões para download
    const buttons = new ActionRowBuilder();
    
    buttons.addComponents(
      new ButtonBuilder()
        .setLabel('PNG')
        .setStyle(ButtonStyle.Link)
        .setURL(avatarURL),
      new ButtonBuilder()
        .setLabel('WebP')
        .setStyle(ButtonStyle.Link)
        .setURL(avatarWebP),
      new ButtonBuilder()
        .setLabel('JPG')
        .setStyle(ButtonStyle.Link)
        .setURL(avatarJPG)
    );
    
    if (avatarGIF) {
      buttons.addComponents(
        new ButtonBuilder()
          .setLabel('GIF')
          .setStyle(ButtonStyle.Link)
          .setURL(avatarGIF)
          .setEmoji('✨')
      );
    }
    
    // Se tem avatar de servidor diferente, adiciona botão
    if (guildAvatarURL && guildAvatarURL !== avatarURL) {
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Avatar Global')
          .setStyle(ButtonStyle.Link)
          .setURL(avatarURL)
          .setEmoji('🌐')
      );
      
      await reply.custom(interaction, { 
        embeds: [embed], 
        components: [buttons, row2] 
      });
    } else {
      await reply.custom(interaction, { 
        embeds: [embed], 
        components: [buttons] 
      });
    }
    
  } catch (error) {
    await handleCommandError(error, interaction);
  }
}