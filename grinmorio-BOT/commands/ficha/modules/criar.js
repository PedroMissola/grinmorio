import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import api from '#utils/api';

export async function handleCriarFicha(interaction, userId, guildId) {
  try {
    // 1. Verifica via API se a ficha já existe para evitar duplicatas.
    await api.get(`/personagens/${guildId}/${userId}`);
    await interaction.reply({
      content: '❌ Você já possui uma ficha. Use `/ficha deletar` primeiro se quiser criar uma nova.',
      ephemeral: true
    });
    return;
  } catch (error) {
    // O erro 404 (Not Found) é o fluxo esperado para um usuário sem ficha.
    // Se o erro for qualquer outro, avisa o usuário e interrompe.
    if (error.response?.status !== 404) {
      console.error("Erro ao verificar ficha existente via API:", error);
      return interaction.reply({ content: '❌ Ocorreu um erro ao verificar sua ficha. Tente novamente.', ephemeral: true });
    }
  }

  // 2. Cria e configura o modal com os campos essenciais.
  const modal = new ModalBuilder()
    .setCustomId(`criar_ficha_modal_${userId}`)
    .setTitle('Criar Nova Ficha de Personagem');

  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Nome do Personagem').setStyle(TextInputStyle.Short).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('raca').setLabel('Raça').setStyle(TextInputStyle.Short).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('classe').setLabel('Classe').setStyle(TextInputStyle.Short).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('atributos').setLabel('Atributos (FOR,DES,CON,INT,SAB,CAR)').setStyle(TextInputStyle.Short).setPlaceholder('Ex: 15,14,13,12,10,8').setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nomeDoJogador').setLabel('Seu Nome (Jogador)').setStyle(TextInputStyle.Short).setValue(interaction.user.username).setRequired(false))
  );

  // 3. Exibe o modal para o usuário.
  await interaction.showModal(modal);

  // 4. Aguarda o envio do modal pelo usuário, com um timeout.
  const modalSubmit = await interaction.awaitModalSubmit({
    filter: i => i.customId === `criar_ficha_modal_${userId}` && i.user.id === userId,
    time: 300000 // 5 minutos
  }).catch(() => null); // Retorna nulo se o tempo esgotar.

  // Se o usuário não enviou o modal a tempo, encerra a função.
  if (!modalSubmit) {
    return;
  }

  // Adia a resposta para ter mais tempo de processar.
  await modalSubmit.deferReply({ ephemeral: true });

  try {
    // 5. Coleta e organiza os dados do modal.
    const nome = modalSubmit.fields.getTextInputValue('nome');
    const raca = modalSubmit.fields.getTextInputValue('raca');
    const classe = modalSubmit.fields.getTextInputValue('classe');
    const atributosStr = modalSubmit.fields.getTextInputValue('atributos');
    const nomeDoJogador = modalSubmit.fields.getTextInputValue('nomeDoJogador');
    const atributos = atributosStr.split(',').map(a => parseInt(a.trim()));

    // Monta o payload para enviar à API.
    const dadosFicha = {
      nome, raca, classe, nomeDoJogador,
      nivel: 1, // Nível inicial padrão
      atributos: {
        forca: atributos[0], destreza: atributos[1], constituicao: atributos[2],
        inteligencia: atributos[3], sabedoria: atributos[4], carisma: atributos[5]
      }
    };

    // 6. Envia os dados para o endpoint de criação da API.
    await api.post('/personagens', { userId, guildId, dadosFicha });

    // 7. Responde ao usuário com uma mensagem de sucesso.
    const embed = new EmbedBuilder()
      .setTitle('✅ Ficha Criada!')
      .setDescription(`**${nome}** foi criado com sucesso!\n\nUse \`/ficha editar\` para adicionar mais detalhes como PV, história, equipamentos e magias.`)
      .setColor(0x28a745);
    await modalSubmit.editReply({ embeds: [embed] });

  } catch (error) {
    // Se a API retornar um erro (ex: validação falhou), exibe a mensagem de erro da API.
    const apiError = error.response?.data?.message || 'Erro ao salvar a ficha. Verifique os dados.';
    await modalSubmit.editReply({ content: `❌ ${apiError}` });
  }
}