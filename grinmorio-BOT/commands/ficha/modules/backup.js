import { AttachmentBuilder } from 'discord.js';
import api from '#utils/api';

export async function handleBackupFicha(interaction, userId, guildId) {
  try {
    await interaction.editReply({ content: 'Gerando a sua ficha em PDF, por favor aguarde... 📄' });

    // --- CORREÇÃO APLICADA AQUI ---
    // Os IDs agora são passados como parâmetros separados na URL, de acordo com a rota da API.
    const response = await api.get(`/personagens/${guildId}/${userId}/pdf`, {
      responseType: 'arraybuffer',
    });

    const contentDisposition = response.headers['content-disposition'];
    let filename = `ficha_${interaction.user.username}.pdf`;
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
            filename = filenameMatch[1];
        }
    }

    const attachment = new AttachmentBuilder(Buffer.from(response.data), {
      name: filename
    });

    await interaction.editReply({
      content: `✅ Aqui está o backup da sua ficha em PDF!`,
      files: [attachment],
      ephemeral: true
    });

  } catch (error) {
    if (error.response?.status === 404) {
      await interaction.editReply({
        content: '❌ Você não possui uma ficha para fazer backup.',
        ephemeral: true
      });
    } else {
      console.error('Erro ao gerar backup em PDF via API:', error);
      await interaction.editReply({
        content: '❌ Houve um erro ao gerar o PDF da sua ficha. O servidor pode estar ocupado.',
        ephemeral: true
      });
    }
  }
}