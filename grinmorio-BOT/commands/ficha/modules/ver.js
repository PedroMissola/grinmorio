import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import api from '#utils/api';
import {
  criarEmbedFicha,
  criarEmbedDetalhes,
  criarEmbedMagias,
  criarEmbedCombate,
  criarEmbedEquipamentos,
  criarEmbedHistoria,
} from '../../utils/ficha/embeds.js';

export async function handleVerFicha(interaction, userId, guildId) {
  try {
    // 1. Busca os dados mais recentes do personagem na API.
    const { data: personagem } = await api.get(`/personagens/${guildId}/${userId}`);

    const embedInicial = criarEmbedFicha(personagem);
    const idBase = `ficha_${interaction.id}`; // ID único para este menu

    // 2. Cria as fileiras de botões para navegação.
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${idBase}_detalhes`).setLabel('📋 Detalhes').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${idBase}_combate`).setLabel('⚔️ Combate').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`${idBase}_equip`).setLabel('🎒 Equipamento').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`${idBase}_magias`).setLabel('✨ Magias').setStyle(ButtonStyle.Primary)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${idBase}_historia`).setLabel('📜 História').setStyle(ButtonStyle.Secondary)
    );

    // 3. Envia a resposta inicial com o embed principal e os botões.
    const response = await interaction.editReply({
      embeds: [embedInicial],
      components: [row1, row2],
      ephemeral: true
    });

    // 4. Cria um coletor para ouvir as interações com os botões.
    const collector = response.createMessageComponentCollector({
      filter: i => i.customId.startsWith(idBase) && i.user.id === interaction.user.id,
      time: 300000 // 5 minutos de tempo para interagir
    });

    collector.on('collect', async i => {
      try {
        await i.deferUpdate(); // Confirma o clique para o Discord
        const action = i.customId.split('_')[2];
        const botaoVoltar = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`${idBase}_voltar`).setLabel('← Voltar').setStyle(ButtonStyle.Secondary));

        // Se o botão for "Voltar", mostra o embed inicial novamente
        if (action === 'voltar') {
          return await i.editReply({ embeds: [criarEmbedFicha(personagem)], components: [row1, row2] });
        }

        // Caso contrário, mostra o embed correspondente à ação
        let novoEmbed;
        switch (action) {
          case 'detalhes': novoEmbed = criarEmbedDetalhes(personagem); break;
          case 'combate': novoEmbed = criarEmbedCombate(personagem); break;
          case 'equip': novoEmbed = criarEmbedEquipamentos(personagem); break;
          case 'magias': novoEmbed = criarEmbedMagias(personagem); break;
          case 'historia': novoEmbed = criarEmbedHistoria(personagem); break;
          default: return; // Ação desconhecida, não faz nada
        }
        await i.editReply({ embeds: [novoEmbed], components: [botaoVoltar] });
      } catch (error) { console.error('Erro no collector da ficha:', error); }
    });

    // 5. Quando o coletor termina (por timeout), desabilita os botões.
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
        // Ignora erros comuns de interação que já não existe mais
        if (error.code !== 'InteractionNotEditable' && error.code !== 10008) {
          console.error('Erro ao desabilitar botões:', error);
        }
      }
    });

  } catch (error) {
    // 6. Trata erros da chamada inicial da API.
    if (error.response?.status === 404) {
      await interaction.editReply({ content: '❌ Você não possui uma ficha. Use `/ficha criar` primeiro.', components: [], embeds: [] });
    } else {
      console.error('Erro ao buscar ficha na API:', error);
      await interaction.editReply({ content: '❌ Ocorreu um erro ao buscar sua ficha.', components: [], embeds: [] });
    }
  }
}