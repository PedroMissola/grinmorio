import { EmbedBuilder } from 'discord.js';
import { calcularModificador } from './utils.js';

/** Helper para formatar o modificador com sinal de + ou - */
const mod = (valor) => {
  const resultado = calcularModificador(valor);
  return resultado >= 0 ? `+${resultado}` : String(resultado);
};

// --- Embeds para cada secção ---

/** Embed Principal (Resumo da Ficha) */
export function criarEmbedFicha(personagem) {
  const p = personagem; // Alias para encurtar
  const embed = new EmbedBuilder()
    .setTitle(`Ficha de ${p.nome}`)
    .setDescription(`*${p.raca} ${p.classe} ${p.nivel}* | *${p.antecedente || 'N/A'}* | *${p.alinhamento || 'N/A'}*`)
    .setColor(0x5865f2)
    .setFields(
      { name: '❤️ Saúde', value: `**PV:** ${p.pvAtuais}/${p.pvMaximos}\n**PV Temp:** ${p.pvTemporarios}\n**Dados de Vida:** ${p.dadosDeVida || 'N/A'}`, inline: true },
      { name: '⚔️ Combate', value: `**CA:** ${p.ca}\n**Iniciativa:** ${mod(p.atributos.destreza)}\n**Desloc.:** ${p.deslocamento || '9m'}`, inline: true },
      { name: '⭐ Geral', value: `**Prof:** +${p.proficienciaBonus}\n**Inspiração:** ${p.inspiracao ? 'Sim' : 'Não'}\n**XP:** ${p.pontosDeExperiencia}`, inline: true },
      { name: '💪 Atributos', value: `**FOR:** ${p.atributos.forca} (${mod(p.atributos.forca)})\n**DES:** ${p.atributos.destreza} (${mod(p.atributos.destreza)})\n**CON:** ${p.atributos.constituicao} (${mod(p.atributos.constituicao)})`, inline: true },
      { name: '🧠 Mental', value: `**INT:** ${p.atributos.inteligencia} (${mod(p.atributos.inteligencia)})\n**SAB:** ${p.atributos.sabedoria} (${mod(p.atributos.sabedoria)})\n**CAR:** ${p.atributos.carisma} (${mod(p.atributos.carisma)})`, inline: true },
      { name: '🛡️ Salvaguardas Contra Morte', value: `**Sucessos:** ${'✅'.repeat(p.salvaguardaMorte.sucessos)}${'⬛'.repeat(3 - p.salvaguardaMorte.sucessos)}\n**Falhas:** ${'❌'.repeat(p.salvaguardaMorte.falhas)}${'⬛'.repeat(3 - p.salvaguardaMorte.falhas)}`, inline: true }
    )
    .setFooter({ text: `Jogador: ${p.nomeDoJogador || 'N/A'} | Última atualização` });

  if (p.ultimaAtualizacao) {
    try { embed.setTimestamp(new Date(p.ultimaAtualizacao)); } catch (e) { /* Ignora data inválida */ }
  }
  return embed;
}

/** Embed de Detalhes (Perícias e Proficiências) */
export function criarEmbedDetalhes(personagem) {
  const p = personagem;
  const periciasProficientes = Object.entries(p.pericias).filter(([, prof]) => prof).map(([nome]) => nome.charAt(0).toUpperCase() + nome.slice(1)).join(', ');
  const salvaguardasProficientes = Object.entries(p.salvaguardas).filter(([, prof]) => prof).map(([nome]) => nome.charAt(0).toUpperCase() + nome.slice(1)).join(', ');

  return new EmbedBuilder()
    .setTitle(`📋 Detalhes & Proficiências de ${p.nome}`)
    .setColor(0x3498db)
    .addFields(
      { name: '👁️ Sabedoria Passiva (Percepção)', value: String(p.sabedoriaPassiva), inline: false },
      { name: '🛡️ Proficiência em Salvaguardas', value: salvaguardasProficientes || 'Nenhuma' },
      { name: '🛠️ Proficiência em Perícias', value: periciasProficientes || 'Nenhuma' },
      { name: '🗣️ Outras Proficiências e Idiomas', value: p.outrasProficienciasEIdiomas || 'Nenhum' },
    );
}

/** Embed de Combate (Ataques e Talentos) */
export function criarEmbedCombate(personagem) {
    const p = personagem;
    const ataques = p.ataquesEMagias && p.ataquesEMagias.length > 0
        ? p.ataquesEMagias.map(ataque => `**${ataque.nome}:** ${ataque.bonusAtaque} para acertar, ${ataque.dano} de dano`).join('\n')
        : 'Nenhum ataque registado.';

    return new EmbedBuilder()
        .setTitle(`⚔️ Combate - ${p.nome}`)
        .setColor(0xe74c3c)
        .addFields(
            { name: 'Ataques e Conjuração', value: ataques.substring(0, 1024) },
            { name: 'Características e Talentos de Combate', value: p.caracteristicasETracos.join('\n').substring(0, 1024) || 'Nenhuma' }
        );
}

/** Embed de Magias (Informações de Conjuração, Slots e Magias Conhecidas) */
export function criarEmbedMagias(personagem) {
    const p = personagem;
    const info = p.magiaInfo;
    const embed = new EmbedBuilder()
        .setTitle(`✨ Magias de ${p.nome}`)
        .setColor(0x9b59b6)
        .addFields(
            { name: 'Classe Conjuradora', value: info.classeConjuradora || 'N/A', inline: true },
            { name: 'Atributo', value: info.atributo || 'N/A', inline: true },
            { name: 'CD | Bônus de Ataque', value: `**${info.cdDasMagias}** | **+${info.bonusDeAtaqueMagico}**`, inline: true }
        );

    // Adiciona um campo para cada círculo de magia que tenha magias ou slots
    for (let nivel = 0; nivel <= 9; nivel++) {
        const magiasConhecidas = p.magias[nivel];
        const slotInfo = nivel > 0 ? p.slotsMagias[nivel - 1] : null;

        if ((magiasConhecidas && magiasConhecidas.length > 0) || (slotInfo && slotInfo.total > 0)) {
            const magiasTexto = magiasConhecidas.join(', ').substring(0, 1024) || 'Nenhuma';
            let titulo = nivel === 0 ? 'Truques' : `${nivel}º Círculo`;

            if (slotInfo) {
                titulo += ` (Slots: ${slotInfo.total - slotInfo.gastos}/${slotInfo.total})`;
            }
            embed.addFields({ name: titulo, value: magiasTexto });
        }
    }
    return embed;
}

/** Embed de Equipamentos e Tesouros */
export function criarEmbedEquipamentos(personagem) {
    const p = personagem;
    return new EmbedBuilder()
        .setTitle(`🎒 Equipamento e Tesouros de ${p.nome}`)
        .setColor(0xf39c12)
        .addFields(
            { name: 'Equipamento e Dinheiro', value: p.equipamentos.substring(0, 1024) || 'Nenhum item.' },
            { name: 'Tesouros', value: p.tesouros.substring(0, 1024) || 'Nenhum tesouro.' }
        );
}

/** Embed de História, Aparência e Personalidade */
export function criarEmbedHistoria(personagem) {
    const p = personagem;
    const per = p.personalidade;
    const ap = p.aparencia;
    const aparenciaTexto = `**Idade:** ${ap.idade || '?'} | **Altura:** ${ap.altura || '?'} | **Peso:** ${ap.peso || '?'}\n**Olhos:** ${ap.olhos || '?'} | **Pele:** ${ap.pele || '?'} | **Cabelo:** ${ap.cabelo || '?'}`;

    return new EmbedBuilder()
        .setTitle(`📜 História e Personalidade de ${p.nome}`)
        .setColor(0x7f8c8d)
        .addFields(
            { name: 'Aparência', value: aparenciaTexto },
            { name: 'Traços de Personalidade', value: per.tracos.substring(0, 1024) || 'Não definido' },
            { name: 'Ideais', value: per.ideais.substring(0, 1024) || 'Não definido' },
            { name: 'Vínculos', value: per.ligacoes.substring(0, 1024) || 'Não definido' },
            { name: 'Fraquezas', value: per.fraquezas.substring(0, 1024) || 'Não definido' },
            { name: 'História', value: p.historia.substring(0, 1024) || 'Nenhuma história definida.' },
            { name: 'Aliados e Organizações', value: p.aliadosEOrganizacoes.substring(0, 1024) || 'Nenhum' }
        );
}

