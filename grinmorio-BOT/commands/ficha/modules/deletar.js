import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import api from '#utils/api';

export async function handleDeletarFicha(interaction, userId, guildId) {
  try {
    const { data: personagem } = await api.get(`/personagens/${guildId}/${userId}`);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Confirmar Exclusão')
      .setDescription(`Tem certeza que deseja deletar a ficha de **${personagem.nome}**?\n\n**Esta ação é irreversível!**`)
      .setColor(0xff0000);

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirmar_deletar_${userId}`)
        .setLabel('✅ Sim, Deletar')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`cancelar_deletar_${userId}`)
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    const response = await interaction.editReply({
      embeds: [embed],
      components: [botoes],
      ephemeral: true
    });

    const filter = i => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter,
      time: 60000 // 60 segundos
    });

    collector.on('collect', async i => {
      if (i.customId === `confirmar_deletar_${userId}`) {
        try {
          await api.delete(`/personagens/${guildId}/${userId}`);

          // AJUSTE 2: Mensagem de sucesso mais completa.
          const embedSucesso = new EmbedBuilder()
            .setTitle('✅ Ficha Deletada')
            .setDescription(`A ficha de **${personagem.nome}** foi removida permanentemente.`)
            .setColor(0x00ff00);

          await i.update({ embeds: [embedSucesso], components: [] });
        } catch (error) {
          console.error('Erro ao deletar ficha na API:', error);
          await i.update({ content: '❌ Erro ao deletar a ficha no servidor. Tente novamente.', embeds: [], components: [] });
        }
      } else {
        await i.update({ content: '❌ Operação cancelada.', embeds: [], components: [] });
      }
    });

    // AJUSTE 1: Handler para o final do coletor (por timeout).
    collector.on('end', async (collected) => {
      // Se nada foi coletado (timeout), a interação ainda existe.
      // Apenas editamos a resposta original para desabilitar os botões ou mostrar uma mensagem.
      if (collected.size === 0) {
        try {
          await interaction.editReply({ 
            content: '❌ Tempo esgotado. A exclusão da ficha foi cancelada.', 
            embeds: [], 
            components: [] 
          });
        } catch (error) {
          // Ignora erros caso a mensagem já tenha sido deletada ou alterada.
          console.error('Erro ao editar mensagem de timeout na exclusão:', error);
        }
      }
    });

  } catch (error) {
    if (error.response?.status === 404) {
      await interaction.editReply({ content: '❌ Você não possui uma ficha para deletar.' });
    } else {
      console.error('Erro ao buscar ficha para deletar:', error);
      await interaction.editReply({ content: '❌ Ocorreu um erro ao iniciar a exclusão.' });
    }
  }
}