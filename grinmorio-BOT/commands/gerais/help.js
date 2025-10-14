import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';

const categorias = {
  gerais: {
    title: '📋 Comandos Gerais',
    description: 'Comandos básicos e utilitários do bot.',
    fields: [
      { name: '`/help`', value: 'Mostra esta lista de comandos.' },
      { name: '`/ping`', value: 'Verifica a latência do bot e da API.' },
    ],
  },
  fichas: {
    title: '🧙‍♂️ Fichas de Personagem',
    description: 'Sistema completo para criar e gerenciar as suas fichas de D&D 5e.',
    fields: [
      { name: '`/ficha criar`', value: 'Abre um formulário para criar uma nova ficha de personagem.' },
      { name: '`/ficha ver`', value: 'Exibe a sua ficha completa com botões para navegar entre as seções.' },
      { name: '`/ficha editar basico`', value: 'Edita nome, raça, classe, antecedente e alinhamento.' },
      { name: '`/ficha editar status`', value: 'Edita PVs, CA, nível, XP, deslocamento e inspiração.' },
      { name: '`/ficha editar atributos`', value: 'Edita todos os seus atributos (FOR, DES, CON, INT, SAB, CAR).' },
      { name: '`/ficha editar personalidade`', value: 'Edita os traços de personalidade, ideais, vínculos e fraquezas.' },
      { name: '`/ficha editar aparencia`', value: 'Edita os detalhes da aparência física do seu personagem.' },
      { name: '`/ficha editar historia`', value: 'Edita a história de fundo, aliados e tesouros.' },
      { name: '`/ficha editar proficiencias`', value: 'Edita perícias, salvaguardas e outros idiomas/proficiências.' },
      { name: '`/ficha editar magia`', value: 'Edita as suas informações de conjurador (classe, atributo, CD).' },
      { name: '`/ficha backup`', value: 'Gera um ficheiro PDF estilizado e preenchido da sua ficha.' },
      { name: '`/ficha deletar`', value: 'Remove permanentemente a sua ficha (ação irreversível).' },
      { name: '`/adicionar <tipo>`', value: 'Adiciona magias, features ou itens à sua ficha com sugestões automáticas.' },
    ],
  },
  rolagens: {
    title: '🎲 Sistema de Rolagens',
    description: 'Use o sistema de rolagem por texto diretamente no chat, sem a necessidade de comandos!',
    fields: [
      {
        name: '📌 Rolagem Padrão',
        value: '`1d20+5`, `2d6+1d8-2` — Qualquer combinação de dados e modificadores.'
      },
      {
        name: '📌 Vantagem / Desvantagem',
        value: '`vantagem+3`, `desvantagem-1` — Rola 2d20 e pega o maior/menor, aplicando o modificador.'
      },
      {
        name: '📌 Multi-Rolagem (Novo!)',
        value: '`3#1d20+4` — Rola 3 dados de 20 lados separadamente, aplicando o modificador (+4) a cada um. Ideal para múltiplos ataques.'
      },
      {
        name: '📌 Iniciativa',
        value: '`iniciativa(+2)` — Rola 1d20, soma o seu modificador e entra na ordem de combate.'
      },
      {
        name: '📌 Gerir Iniciativa',
        value: '`listariniciativas` — Mostra a ordem de combate atual.\n`limpariniciativas` — Limpa a lista de iniciativas.'
      }
    ],
  },
  consultas: {
    title: '📚 Consultas Rápidas',
    description: 'Comandos para buscar informações de D&D 5e.',
    fields: [
      { name: '`/monstro nome:<nome>`', value: 'Mostra a ficha de um monstro (em inglês, ex: `goblin`).' },
      { name: '`/habilidade magia nome:<nome>`', value: 'Busca os detalhes de uma magia (em inglês, ex: `fireball`).' },
      { name: '`/item info nome:<nome>`', value: 'Busca os detalhes de um item ou equipamento.' },
      { name: '`/monstros`', value: 'Lista todos os monstros disponíveis com paginação.' },
      { name: '`/habilidades <tipo>`', value: 'Lista magias ou features com filtros.' },
    ],
  },
};

const categoriaKeys = Object.keys(categorias);

function criarEmbed(categoriaKey) {
  const cat = categorias[categoriaKey];
  return new EmbedBuilder()
    .setTitle(cat.title)
    .setColor(0x5865f2)
    .setDescription(cat.description)
    .setFields(cat.fields) // Alterado de addFields para setFields para garantir que o conteúdo seja substituído
    .setFooter({ text: 'Use os botões abaixo para navegar entre as categorias.' });
}

function criarBotoes(categoriaAtual) {
  const rows = [];
  let currentRow = new ActionRowBuilder();

  categoriaKeys.forEach((key, index) => {
    const cat = categorias[key];
    // Extrai o emoji e o primeiro nome do título para usar como label do botão
    const label = `${cat.title.split(' ')[0]} ${cat.title.split(' ')[1]}`;

    const button = new ButtonBuilder()
      .setCustomId(`help_${key}`)
      .setLabel(label.replace('Comandos', '').replace('Fichas', 'Ficha').trim()) // Deixa o texto do botão mais curto
      .setStyle(categoriaAtual === key ? ButtonStyle.Primary : ButtonStyle.Secondary);

    if (currentRow.components.length === 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
    currentRow.addComponents(button);
  });
  rows.push(currentRow);

  return rows;
}

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Mostra todos os comandos disponíveis.');

export async function execute(interaction) {
  const categoriaInicial = 'gerais';
  const embed = criarEmbed(categoriaInicial);
  const botoes = criarBotoes(categoriaInicial);

  await interaction.reply({ embeds: [embed], components: botoes, ephemeral: true });

  const filter = i => i.customId.startsWith('help_') && i.user.id === interaction.user.id;
  const collector = interaction.channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 180000, // 3 minutos
  });

  collector.on('collect', async i => {
    try {
      await i.deferUpdate();
      const novaCategoria = i.customId.replace('help_', '');
      const novoEmbed = criarEmbed(novaCategoria);
      const novosBotoes = criarBotoes(novaCategoria);
      await i.editReply({ embeds: [novoEmbed], components: novosBotoes });
    } catch (e) {
      console.error("Erro ao atualizar /help", e)
    }
  });

  collector.on('end', async () => {
    try {
      const reply = await interaction.fetchReply();
      if (reply.components.length > 0) {
        const disabledComponents = reply.components.map(row => {
          const newRow = new ActionRowBuilder();
          row.components.forEach(comp => {
            newRow.addComponents(ButtonBuilder.from(comp).setDisabled(true));
          });
          return newRow;
        });
        await interaction.editReply({ components: disabledComponents });
      }
    } catch (error) {
      if (error.code !== 10008) { // Ignora o erro de "Mensagem Desconhecida"
        console.error('Erro ao remover botões do /help:', error);
      }
    }
  });
}