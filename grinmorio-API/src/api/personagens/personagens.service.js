import { getPersonagensCollection } from '../../utils/database.js';
import { templatePersonagem } from '../../models/personagem.model.js';
import { obterBonusProficiencia, garantirEstruturaCompativel } from '../../utils/ficha.utils.js';
import logger from '../../utils/logger.js';
import redisClient from '../../utils/redisClient.js'; // 1. IMPORTE O CLIENTE REDIS
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

function calcularModificador(valor) {
  if (typeof valor !== 'number' || isNaN(valor)) return 0;
  return Math.floor((valor - 10) / 2);
}

export const personagensService = {
  async create(userId, guildId, dadosFicha) {
    const collection = getPersonagensCollection();
    const docId = `${guildId}_${userId}`;
    const existing = await collection.findOne({ _id: docId });

    if (existing) {
      throw new Error('Este usuário já possui uma ficha.');
    }

    const novaFicha = {
      _id: docId, // Define o ID customizado no MongoDB
      ...templatePersonagem,
      ...dadosFicha,
      nivel: dadosFicha.nivel || 1,
      proficienciaBonus: obterBonusProficiencia(dadosFicha.nivel || 1),
      criadoEm: new Date(),
      ultimaAtualizacao: new Date(),
    };

    await collection.insertOne(novaFicha);
    logger.info(`Ficha criada para ${userId} no servidor ${guildId}`);
    return novaFicha;
  },

  async getById(userId, guildId) {
    const docId = `${guildId}_${userId}`;
    const cacheKey = `character:${docId}`;

    // 1. Tenta buscar a ficha do Redis
    const cachedCharacter = await redisClient.get(cacheKey);
    if (cachedCharacter) {
      logger.info(`Cache HIT para a ficha ${docId}`);
      return JSON.parse(cachedCharacter);
    }

    // 2. Se não está no cache (Cache Miss), busca no MongoDB
    logger.info(`Cache MISS para a ficha ${docId}, buscando no DB...`);
    const collection = getPersonagensCollection();
    const personagem = await collection.findOne({ _id: docId });

    if (!personagem) {
      throw new Error('Ficha de personagem não encontrada.');
    }

    // 3. Garante a compatibilidade e salva no Redis antes de retornar
    const personagemCompativel = garantirEstruturaCompativel(personagem);
    // Salva no cache por 1 hora (3600 segundos)
    await redisClient.set(cacheKey, JSON.stringify(personagemCompativel), { EX: 3600 });

    return personagemCompativel;
  },

  async update(userId, guildId, updates) {
    const collection = getPersonagensCollection();
    const docId = `${guildId}_${userId}`;

    if (updates.nivel) {
      updates.proficienciaBonus = obterBonusProficiencia(updates.nivel);
    }
    const updatePayload = { $set: { ...updates, ultimaAtualizacao: new Date() } };
    const result = await collection.updateOne({ _id: docId }, updatePayload);

    if (result.matchedCount === 0) {
      throw new Error('Ficha de personagem não encontrada para atualizar.');
    }

    // 4. Invalida (deleta) o cache após a atualização no DB
    const cacheKey = `character:${docId}`;
    await redisClient.del(cacheKey);
    logger.info(`Ficha de ${userId} atualizada no DB e cache invalidado.`);

    return { message: 'Ficha atualizada com sucesso.' };
  },

  async deleteById(userId, guildId) {
    const collection = getPersonagensCollection();
    const docId = `${guildId}_${userId}`;
    const result = await collection.deleteOne({ _id: docId });

    if (result.deletedCount === 0) {
      throw new Error('Ficha de personagem não encontrada para deletar.');
    }

    // 5. Invalida (deleta) o cache após a deleção no DB
    const cacheKey = `character:${docId}`;
    await redisClient.del(cacheKey);
    logger.info(`Ficha de ${userId} deletada do DB e cache invalidado.`);

    return { message: 'Ficha deletada com sucesso.' };
  },

  async addItem(userId, guildId, tipo, nomeItem) {
    let itemData;
    const port = process.env.PORT || 3000;
    const apiBaseUrl = `http://localhost:${port}/api`;

    switch (tipo) {
      case 'magia':
        try {
          const { data } = await axios.get(`${apiBaseUrl}/magias/${nomeItem}`);
          itemData = data;
        } catch (error) {
          if (error.response?.status === 404) {
            throw new Error(`Magia "${nomeItem}" não encontrada em nossa base de dados.`);
          }
          throw new Error('Erro ao buscar dados da magia.');
        }
        break;
      case 'item':
      case 'feature':
        // Adicionar lógica para outros tipos quando os endpoints existirem
        throw new Error(`Ainda não é possível adicionar itens do tipo '${tipo}'.`);
      default:
        throw new Error('Tipo de item inválido.');
    }

    const personagem = await this.getById(userId, guildId);
    const updates = {};

    if (tipo === 'magia') {
      const nivelMagiaStr = itemData.level_school.match(/\d/)?.[0] || '0';
      const nivelMagia = parseInt(nivelMagiaStr, 10);

      if (!personagem.magias[nivelMagia].map(s => s.toLowerCase()).includes(itemData.name.toLowerCase())) {
        personagem.magias[nivelMagia].push(itemData.name);
        updates.magias = personagem.magias;
      } else {
        throw new Error(`Magia "${itemData.name}" já existe na ficha.`);
      }
    }

    if (Object.keys(updates).length > 0) {
      await this.update(userId, guildId, updates);
    }

    return { message: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} "${itemData.name}" adicionado(a) com sucesso!` };
  },

  async generatePdf(personagem) {
    const p = personagem;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const templatePath = path.join(__dirname, '..', '..', 'assets', 'Ficha.pdf');

    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    const setText = (fieldName, text) => {
      try { form.getTextField(fieldName).setText(String(text || '')); }
      catch (e) { console.warn(`Campo de PDF não encontrado: ${fieldName}`); }
    };
    const setCheckbox = (fieldName, checked) => {
      try { if (checked) form.getCheckBox(fieldName).check(); else form.getCheckBox(fieldName).uncheck(); }
      catch (e) { console.warn(`Campo de PDF não encontrado: ${fieldName}`); }
    };

    // --- PÁGINA 1 ---
    setText('NOME DO PERSONAGEM', p.nome);
    setText('CLASSE E NIVEL', `${p.classe} / ${p.nivel}`);
    setText('ANTECEDENTE', p.antecedente);
    setText('NOME DO JOGADOR', p.nomeDoJogador);
    setText('RAÇA', p.raca);
    setText('ALINHAMENTO', p.alinhamento);
    setText('PONTOS DE EXPERIÊNCIA', p.pontosDeExperiencia);

    setText('FORÇA', p.atributos.forca);
    setText('DESTREZA', p.atributos.destreza);
    setText('CONSTITUIÇÃO', p.atributos.constituicao);
    setText('INTELIGENCIA', p.atributos.inteligencia);
    setText('SABEDORIA', p.atributos.sabedoria);
    setText('CARISMA', p.atributos.carisma);

    setText('CLASSE DE ARMADURA', p.ca);
    setText('INICIATIVA', `+${calcularModificador(p.atributos.destreza)}`);
    setText('DESLOCAMENTO', p.deslocamento);
    setText('Pontos de Vida Máximos', p.pvMaximos);
    setText('PONTOS DE VIDA ATUAIS', p.pvAtuais);
    setText('PONTOS DE VIDA TEMPORÁRIOS', p.pvTemporarios);
    setText('DADO DE VIDA', p.dadosDeVida);
    setText('BONUS DE PROFICIÊNCIA', `+${p.proficienciaBonus}`);

    for (let i = 1; i <= p.salvaguardaMorte.sucessos; i++) setCheckbox(`SUCESSOS ${i}`, true);
    for (let i = 1; i <= p.salvaguardaMorte.falhas; i++) setCheckbox(`FALHAS ${i}`, true);

    const periciasMap = { acrobacia: 11, arcanismo: 12, atletismo: 13, atuacao: 14, enganacao: 15, furtividade: 16, historia: 17, intimidacao: 18, intuicao: 19, investigacao: 20, 'animais': 21, medicina: 22, natureza: 23, percepcao: 24, persuasao: 25, prestidigitacao: 26, religiao: 27, sobrevivencia: 28 };
    const salvaguardasMap = { forca: 1, destreza: 2, constituicao: 3, inteligencia: 4, sabedoria: 5, carisma: 6 };
    for (const [nome, prof] of Object.entries(p.pericias)) if (periciasMap[nome.toLowerCase()]) setCheckbox(`Check Box ${periciasMap[nome.toLowerCase()]}`, prof);
    for (const [nome, prof] of Object.entries(p.salvaguardas)) if (salvaguardasMap[nome.toLowerCase()]) setCheckbox(`Check Box ${salvaguardasMap[nome.toLowerCase()]}`, prof);

    setText('SABEDORIA PASSIVA (PERCEPÇÃO', p.sabedoriaPassiva);
    setText('OUTRAS PROFICIÊNCIAS & IDIOMAS', p.outrasProficienciasEIdiomas);
    setText('EQUIPAMENTO', p.equipamentos);
    setText('TRAÇOS DE PERSONALIDADE', p.personalidade.tracos);
    setText('IDEAIS', p.personalidade.ideais);
    setText('VINCULOS', p.personalidade.ligacoes);
    setText('FRAQUEZAS', p.personalidade.fraquezas);
    setText('CARACTERÍSTICAS & TALENTOS', p.caracteristicasETracos.join('\n'));

    // --- PÁGINA 2 ---
    setText('NOME DO PERSONAGEM 2', p.nome);
    setText('IDADE', p.aparencia.idade);
    setText('ALTURA', p.aparencia.altura);
    setText('PESO', p.aparencia.peso);
    setText('COR DOS OLHOS', p.aparencia.olhos);
    setText('COR DA PELE', p.aparencia.pele);
    setText('COR DO CABELO', p.aparencia.cabelo);
    setText('HISTORIA DO PERSONAGEM', p.historia);
    setText('ALIADOS & ORGANIZAÇÕES', p.aliadosEOrganizacoes);
    setText('TESOUROS', p.tesouros);

    // --- PÁGINA 3 ---
    setText('CLASSE CONJURADORA', p.magiaInfo.classeConjuradora);
    setText('ATRIBUTO DE CONJURAÇÃO', p.magiaInfo.atributo);
    setText('CD PARA EVITAR SUAS MAGIAS', p.magiaInfo.cdDasMagias);
    setText('MODIFICADOR DE ATAQUE MÁGICO', `+${p.magiaInfo.bonusDeAtaqueMagico}`);

    setText('TRUQUES', p.magias[0].join('\n'));
    for (let i = 1; i <= 9; i++) {
      setText(`ESPAÇOS TOTAIS ${i}`, p.slotsMagias[i - 1].total);
      setText(`ESPAÇOS UTILIZADOS ${i}`, p.slotsMagias[i - 1].gastos);
      setText(`NOME DA MAGIA ${i}`, p.magias[i].join('\n'));
    }

    form.flatten();
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
};