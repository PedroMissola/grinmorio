import {
  SlashCommandBuilder,
} from 'discord.js';
import { customEmbed } from '#responses/embeds';

const categorias = {
  gerais: {
    title: '📋 Comandos Gerais',
    description: 'Comandos básicos e utilitários do bot.',
    fields: [
      { name: '`/help`', value: 'Mostra esta lista de comandos.' },
      { name: '`/ping`', value: 'Verifica a latência do bot e da API.' },
      { name: '`/avatar`', value: 'Exibe o avatar de um usuário.' },
      { name: '`/banner`', value: 'Exibe o banner de um usuário.' },
      { name: '`/botinfo`', value: 'Exibe informações sobre o bot.' },
      { name: '`/serverinfo`', value: 'Exibe informações sobre o servidor.' },
      { name: '`/userinfo`', value: 'Exibe informações sobre um usuário.' },
    ],
  },
};

function criarEmbed() {
  const cat = categorias.gerais;
  return customEmbed({
    title: cat.title,
    color: 0x5865f2,
    description: cat.description,
    fields: cat.fields,
    footer: { text: 'Grinmorio, seu assistente de servidor!' }
  });
}

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Mostra todos os comandos disponíveis.');

export async function execute(interaction) {
  const embed = criarEmbed();
  await interaction.reply({ embeds: [embed], ephemeral: true });
}