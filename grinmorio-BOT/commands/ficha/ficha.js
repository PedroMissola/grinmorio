import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { handleCriarFicha } from './modules/criar.js';
import { handleVerFicha } from './modules/ver.js';
import { handleEditarFicha } from './modules/editar/editar.js';
import { handleDeletarFicha } from './modules/deletar.js';
import { handleBackupFicha } from './modules/backup.js';
import { handleCommandError } from '#utils/errorHandler';
import log from '#utils/logger';

export const data = new SlashCommandBuilder()
  .setName('ficha')
  .setDescription('Sistema de ficha de personagem de D&D 5e')
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
  .addSubcommand(sub => sub.setName('criar').setDescription('Cria uma nova ficha de personagem'))
  .addSubcommand(sub => sub.setName('ver').setDescription('Mostra sua ficha de personagem'))
  .addSubcommandGroup(group =>
    group.setName('editar').setDescription('Edita campos da sua ficha.')
      .addSubcommand(sub => sub.setName('basico').setDescription('Edita nome, raça, classe, nível e antecedente.'))
      .addSubcommand(sub => sub.setName('status').setDescription('Edita PVs, CA, deslocamento, inspiração e XP.'))
      .addSubcommand(sub => sub.setName('atributos').setDescription('Edita Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma.'))
      .addSubcommand(sub => sub.setName('personalidade').setDescription('Edita traços, ideais, vínculos e fraquezas.'))
      .addSubcommand(sub => sub.setName('aparencia').setDescription('Edita a descrição física do seu personagem.'))
      .addSubcommand(sub => sub.setName('historia').setDescription('Edita a história, aliados e tesouros do personagem.'))
      .addSubcommand(sub => sub.setName('proficiencias').setDescription('Edita perícias, salvaguardas, idiomas e outras proficiências.'))
      .addSubcommand(sub => sub.setName('magia').setDescription('Edita informações e espaços de magia.'))
  )
  .addSubcommand(sub => sub.setName('deletar').setDescription('Remove sua ficha (irreversível)'))
  .addSubcommand(sub => sub.setName('backup').setDescription('Gera um backup JSON da sua ficha'));

// Configuração de cooldown (3 segundos)
export const cooldown = 3;

// Permissões necessárias
export const permissions = {
  user: [], // Qualquer usuário pode usar
  bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
};

export async function execute(interaction) {
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;

  try {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    // Log da execução do comando
    log.command(interaction);

    // Defer reply para comandos que não são criar ou editar
    // (criar e editar usam modais, então não precisam de defer inicial)
    if (subcommand !== 'criar' && subcommandGroup !== 'editar') {
      await interaction.deferReply({ ephemeral: true });
    }

    // Roteamento para grupo de edição
    if (subcommandGroup === 'editar') {
      await handleEditarFicha(interaction, userId, guildId, subcommand);
      return;
    }

    // Roteamento para subcomandos individuais
    switch (subcommand) {
      case 'criar':
        await handleCriarFicha(interaction, userId, guildId);
        break;

      case 'ver':
        await handleVerFicha(interaction, userId, guildId);
        break;

      case 'deletar':
        await handleDeletarFicha(interaction, userId, guildId);
        break;

      case 'backup':
        await handleBackupFicha(interaction, userId, guildId);
        break;

      default:
        log.warn(`Subcomando desconhecido: ${subcommand}`);
        await interaction.editReply({
          content: '❌ Subcomando não implementado ou inválido.'
        });
        break;
    }
  } catch (error) {
    // Usa o handler centralizado de erros
    await handleCommandError(error, interaction);
  }
}