import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import api from '#utils/api';
import { autocompleteCache } from '../utils/autocompleteCache.js'; // <--- IMPORTE A CACHE

/**
 * Handler para o evento de autocomplete do Discord.
 * Agora apenas lê da cache que já está pronta.
 */
export async function autocomplete(interaction) {
  const subcomando = interaction.options.getSubcommand();
  const focusedValue = interaction.options.getFocused().toLowerCase();
  
  let choices = [];
  if (subcomando === 'magia') choices = autocompleteCache.magia;
  if (subcomando === 'feature') choices = autocompleteCache.feature;
  if (subcomando === 'item') choices = autocompleteCache.item;

  const filtered = choices
    .filter(choice => choice.name.toLowerCase().includes(focusedValue))
    .slice(0, 25);

  await interaction.respond(filtered);
}

// --- Definição e Execução do Comando ---

export const data = new SlashCommandBuilder()
  .setName('adicionar')
  .setDescription('Adiciona magias, features ou itens à sua ficha.')
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
  .addSubcommand(sub =>
    sub.setName('magia')
      .setDescription('Adiciona uma magia à sua ficha.')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('Comece a digitar o nome da magia em inglês para ver sugestões.')
          .setRequired(true)
          .setAutocomplete(true) // Habilita o autocomplete para esta opção
      )
  )
  .addSubcommand(sub =>
    sub.setName('feature')
      .setDescription('Adiciona uma feature (habilidade de classe) à sua ficha.')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('Comece a digitar o nome da feature para ver sugestões.')
          .setRequired(true)
          .setAutocomplete(true) // Habilita o autocomplete
      )
  )
  .addSubcommand(sub =>
    sub.setName('item')
      .setDescription('Adiciona um item à sua ficha.')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('Comece a digitar o nome do item para ver sugestões.')
          .setRequired(true)
          .setAutocomplete(true) // Habilita o autocomplete
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  const tipo = interaction.options.getSubcommand();
  // O valor aqui será o `index` (valor) da opção selecionada no autocomplete.
  const nomeItem = interaction.options.getString('nome');

  try {
    const { data } = await api.post(`/personagens/${guildId}/${userId}/adicionar-item`, {
      tipo,
      nomeItem, // A API do backend já espera o 'index' (ex: 'fireball')
    });

    const embed = new EmbedBuilder()
      .setTitle('✅ Item Adicionado!')
      .setDescription(data.message)
      .setColor(0x28a745);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error(`Erro na API ao adicionar item:`, error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || 'Ocorreu um erro ao tentar adicionar o item.';
    await interaction.editReply({ content: `❌ ${errorMessage}` });
  }
}
