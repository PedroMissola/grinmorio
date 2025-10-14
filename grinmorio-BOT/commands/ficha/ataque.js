// ARQUIVO: commands/ataque.js

import { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import api from '#utils/api';

export const data = new SlashCommandBuilder()
  .setName('ataque')
  .setDescription('Gerencia os ataques customizados da sua ficha.')
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
  .addSubcommand(sub => sub.setName('adicionar').setDescription('Adiciona um novo ataque à sua ficha.'))
  .addSubcommand(sub =>
    sub.setName('remover')
      .setDescription('Remove um ataque pelo nome.')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('O nome exato do ataque a ser removido.')
          .setRequired(true)
      )
  )
  .addSubcommand(sub => sub.setName('listar').setDescription('Lista todos os seus ataques customizados.'));

async function handleAdicionar(interaction) {
    const modal = new ModalBuilder().setCustomId(`add_ataque_${interaction.id}`).setTitle('Adicionar Novo Ataque');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Nome do Ataque').setStyle(TextInputStyle.Short).setPlaceholder('Ex: Espada Longa').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bonus').setLabel('Bônus de Acerto').setStyle(TextInputStyle.Short).setPlaceholder('Ex: +5').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dano').setLabel('Dano e Tipo').setStyle(TextInputStyle.Short).setPlaceholder('Ex: 1d8+3 Cortante').setRequired(true))
    );
    await interaction.showModal(modal);
    const modalSubmit = await interaction.awaitModalSubmit({ time: 300000 });
    await modalSubmit.deferReply({ ephemeral: true });

    const ataque = {
        nome: modalSubmit.fields.getTextInputValue('nome'),
        bonus: modalSubmit.fields.getTextInputValue('bonus'),
        dano: modalSubmit.fields.getTextInputValue('dano'),
    };
    
    const { data } = await api.post(`/personagens/${interaction.guild.id}/${interaction.user.id}/gerenciar-ataque`, { tipo: 'adicionar', payload: ataque });
    await modalSubmit.editReply({ content: `✅ ${data.message}` });
}

export async function execute(interaction) {
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  const subcomando = interaction.options.getSubcommand();

  try {
    if (subcomando === 'adicionar') {
      await handleAdicionar(interaction);
      return;
    }
    
    await interaction.deferReply({ ephemeral: true });

    if (subcomando === 'remover') {
      const nome = interaction.options.getString('nome');
      const { data } = await api.post(`/personagens/${guildId}/${userId}/gerenciar-ataque`, { tipo: 'remover', payload: { nome } });
      await interaction.editReply({ content: `✅ ${data.message}` });
    } else if (subcomando === 'listar') {
      const { data: personagem } = await api.get(`/personagens/${guildId}/${userId}`);
      const ataques = personagem.ataquesEMagias || [];

      const embed = new EmbedBuilder()
        .setTitle(`⚔️ Ataques de ${personagem.nome}`)
        .setColor(0xD32F2F);

      if (ataques.length === 0) {
        embed.setDescription('Nenhum ataque customizado definido.');
      } else {
        ataques.forEach(ataque => {
            embed.addFields({ name: ataque.nome, value: `**Acerto:** ${ataque.bonus} | **Dano:** ${ataque.dano}` });
        });
      }
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
     if (error.code === 'INTERACTION_COLLECTOR_ERROR') return;
     console.error(`Erro no comando /ataque:`, error.response?.data || error.message);
     const errorMessage = error.response?.data?.message || 'Ocorreu um erro ao gerenciar seus ataques.';
     if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: `❌ ${errorMessage}` });
     }
  }
}