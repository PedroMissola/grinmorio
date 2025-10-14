import { templatePersonagem } from '../models/personagem.model.js';

/**
 * Calcula o modificador de um atributo.
 * @param {number} valor O valor do atributo (ex: 14).
 * @returns {number} O modificador correspondente (ex: 2).
 */
export function calcularModificador(valor) {
  if (typeof valor !== 'number' || isNaN(valor)) return 0;
  return Math.floor((valor - 10) / 2);
}

/**
 * Determina o bônus de proficiência com base no nível do personagem.
 * @param {number} nivel O nível do personagem.
 * @returns {number} O bônus de proficiência.
 */
export function obterBonusProficiencia(nivel) {
  if (nivel <= 4) return 2;
  if (nivel <= 8) return 3;
  if (nivel <= 12) return 4;
  if (nivel <= 16) return 5;
  return 6;
}

/**
 * Garante que uma ficha de personagem, possivelmente de uma versão antiga,
 * seja compatível com a estrutura de dados mais recente.
 * @param {object} personagem O objeto do personagem vindo do banco de dados.
 * @returns {object} O objeto do personagem com todos os campos do modelo atual.
 */
export function garantirEstruturaCompativel(personagem) {
  // Começa com um template padrão e sobrescreve com os dados do personagem.
  // O 'deep merge' (mesclagem profunda) é complexo, então faremos manualmente para garantir a estrutura correta.
  const fichaCompleta = JSON.parse(JSON.stringify(templatePersonagem));

  // Itera sobre as chaves do personagem existente e as copia para o template
  for (const key in personagem) {
    if (personagem.hasOwnProperty(key) && fichaCompleta.hasOwnProperty(key)) {
      // Se a chave for um objeto no template (e não um array), mescla os sub-campos.
      if (typeof fichaCompleta[key] === 'object' && !Array.isArray(fichaCompleta[key]) && fichaCompleta[key] !== null) {
        Object.assign(fichaCompleta[key], personagem[key]);
      } else {
        fichaCompleta[key] = personagem[key];
      }
    }
  }

  // --- Verificações Específicas para Estruturas Antigas ---

  // 1. Migra 'defeitos' para 'fraquezas'
  if (personagem.personalidade && personagem.personalidade.defeitos) {
    fichaCompleta.personalidade.fraquezas = personagem.personalidade.defeitos;
  }

  // 2. Migra 'equipamentos' de array para string
  if (Array.isArray(personagem.equipamentos)) {
    fichaCompleta.equipamentos = personagem.equipamentos.join('\n');
  }

  // 3. Migra 'aparencia' de string para objeto
  if (typeof personagem.aparencia === 'string' && personagem.aparencia.length > 0) {
    // Se a aparência era uma string, movemos para o campo de história para não perder o texto.
    // O usuário poderá reorganizar usando os novos comandos de edição.
    fichaCompleta.historia = `(Aparência anterior: ${personagem.aparencia})\n${fichaCompleta.historia || ''}`;
    // E garantimos que a nova aparência seja um objeto.
    fichaCompleta.aparencia = templatePersonagem.aparencia;
  }
  
  // Garante que os novos objetos aninhados existam
  if (!fichaCompleta.salvaguardaMorte) fichaCompleta.salvaguardaMorte = templatePersonagem.salvaguardaMorte;
  if (!fichaCompleta.magiaInfo) fichaCompleta.magiaInfo = templatePersonagem.magiaInfo;
  
  // Garante que o array de slots de magia tenha o formato correto
  if (!Array.isArray(fichaCompleta.slotsMagias) || fichaCompleta.slotsMagias.length !== 9) {
    fichaCompleta.slotsMagias = templatePersonagem.slotsMagias;
  }

  return fichaCompleta;
}

