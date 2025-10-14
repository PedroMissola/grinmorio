import { getRolagensHistoricoCollection } from '../../utils/database.js';
import logger from '../../utils/logger.js';
import redisClient from '../../utils/redisClient.js'; // 1. IMPORTE O CLIENTE REDIS

// --- SISTEMA DE AJUDINHA (100% NO REDIS) ---
async function registrarDadoParaAjudinhaRedis(guildId, userId, valor, tipoDado) {
    const redisKey = `user_roll_stats:${guildId}_${userId}`;
    const fieldKey = `d${tipoDado}_history`;
    const ajudinhaFieldKey = `d${tipoDado}_ajudinha`;

    const historicoJson = await redisClient.hGet(redisKey, fieldKey);
    const historico = historicoJson ? JSON.parse(historicoJson) : [];

    historico.push(valor);
    if (historico.length > 5) historico.shift();

    let ajudinhaAtiva = false;
    if (historico.length >= 5) {
        const media = historico.reduce((a, b) => a + b, 0) / 5;
        const mediaEsperada = (1 + tipoDado) / 2;
        ajudinhaAtiva = media < mediaEsperada;
    }

    await redisClient.hSet(redisKey, fieldKey, JSON.stringify(historico));
    await redisClient.hSet(redisKey, ajudinhaFieldKey, ajudinhaAtiva ? 'true' : 'false');
}

// --- LÓGICA DE ROLAGEM E REGISTRO ---
async function registrarRolagem(dados) {
    try {
        const collection = getRolagensHistoricoCollection();
        await collection.insertOne({ ...dados, timestamp: new Date() });
        logger.info(`Rolagem de ${dados.username} [${dados.tipoRolagem}] salva no MongoDB`);
    } catch (error) {
        logger.error(`Falha ao salvar rolagem para ${dados.userId}:`, error);
    }
}

async function processarRolagem(expressao, guildId, userId) {
    const rolagens = [];
    let total = 0;
    const detalhes = [];
    let modificadores = 0;
    let tipoRolagem = 'NORMAL';

    // --- NOVA LÓGICA PARA ROLAGEM MÚLTIPLA ---
    const multiRollMatch = expressao.toLowerCase().match(/^(\d+)#(\d*d\d+)([+-]\d+)?$/);

    if (multiRollMatch) {
        tipoRolagem = 'MÚLTIPLA';
        const numRolagens = parseInt(multiRollMatch[1]);
        const dadoExp = multiRollMatch[2]; // ex: "1d20"
        const mod = parseInt(multiRollMatch[3]) || 0; // ex: "+5" ou undefined

        if (numRolagens > 100) throw new Error('O número de rolagens múltiplas não pode exceder 100.');

        const [qtdStr, ladosStr] = dadoExp.split('d');
        const qtd = parseInt(qtdStr) || 1;
        const lados = parseInt(ladosStr);
        if (isNaN(lados)) throw new Error(`Dado inválido na rolagem múltipla: ${dadoExp}`);

        for (let i = 0; i < numRolagens; i++) {
            const resultados = Array.from({ length: qtd }, () => Math.floor(Math.random() * lados) + 1);
            const somaDados = resultados.reduce((a, b) => a + b, 0);
            const resultadoFinal = somaDados + mod;

            let detalhe = `Rolagem ${i + 1}: 🎲 ${qtd}d${lados} [${resultados.join(', ')}]`;
            if (mod !== 0) detalhe += ` ${mod > 0 ? '+' : ''} ${mod}`;
            detalhe += ` = **${resultadoFinal}**`;

            detalhes.push(detalhe);
            // Registra cada dado individualmente para a "ajudinha"
            for (const r of resultados) {
                await registrarDadoParaAjudinhaRedis(guildId, userId, r, lados);
            }
        }

        // Para rolagens múltiplas, o "total" não é uma soma, então retornamos um texto.
        return { tipoRolagem, rolagens: [], modificadores: mod, total: "Múltiplas rolagens", detalhes };
    }
    // --- FIM DA NOVA LÓGICA ---

    // Lógica antiga para rolagens normais (continua igual)
    let tokens = expressao.toLowerCase().match(/(vantagem|desvantagem)([+-]\d+)?|[+-]?\d*d\d+|[+-]\d+/g) || [];

    if (tokens.some(t => t.startsWith('vantagem'))) tipoRolagem = 'VANTAGEM';
    if (tokens.some(t => t.startsWith('desvantagem'))) tipoRolagem = 'DESVANTAGEM';

    if (tipoRolagem === 'VANTAGEM' || tipoRolagem === 'DESVANTAGEM') {
        const r1 = Math.floor(Math.random() * 20) + 1;
        const r2 = Math.floor(Math.random() * 20) + 1;
        rolagens.push({ dado: 'd20', resultado: r1 }, { dado: 'd20', resultado: r2 });
        const resultadoFinal = (tipoRolagem === 'VANTAGEM') ? Math.max(r1, r2) : Math.min(r1, r2);
        total += resultadoFinal;
        detalhes.push(`🎲 1d20 (${tipoRolagem}): [${r1}, ${r2}] → ${resultadoFinal}`);
        tokens = tokens.filter(t => !t.startsWith('vantagem') && !t.startsWith('desvantagem'));
    }

    for (const token of tokens) {
        if (token.includes('d')) {
            const sinal = token.startsWith('-') ? -1 : 1;
            const [qtdStr, ladosStr] = token.replace(/^[+-]/, '').split('d');
            const qtd = parseInt(qtdStr) || 1;
            const lados = parseInt(ladosStr);
            if (isNaN(lados) || qtd > 100 || lados > 1000) throw new Error(`Rolagem inválida: ${token}`);
            const resultados = Array.from({ length: qtd }, () => Math.floor(Math.random() * lados) + 1);
            resultados.forEach(r => rolagens.push({ dado: `d${lados}`, resultado: r }));
            const soma = resultados.reduce((a, b) => a + b, 0);
            total += soma * sinal;
            detalhes.push(`🎲 ${sinal > 0 ? '' : '-'}${qtd}d${lados}: [${resultados.join(', ')}] = ${soma}`);
            for (const r of resultados) {
                await registrarDadoParaAjudinhaRedis(guildId, userId, r, lados);
            }
        } else {
            const valor = parseInt(token);
            if (!isNaN(valor)) modificadores += valor;
        }
    }

    total += modificadores;
    if (modificadores !== 0) detalhes.push(`🔧 Modificador: ${modificadores > 0 ? `+${modificadores}` : modificadores}`);

    return { tipoRolagem, rolagens, modificadores, total, detalhes };
}

// --- SERVIÇO EXPORTADO ---
export const rolagensService = {
    async rolarDados(expressao, userId, guildId, username) {
        logger.info(`Processando rolagem "${expressao}" para ${username}`);
        const resultado = await processarRolagem(expressao, guildId, userId);
        await registrarRolagem({ guildId, userId, username, expressao, ...resultado });
        return { total: resultado.total, detalhes: resultado.detalhes };
    },

    async rolarIniciativa(modificador, userId, guildId, username) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + modificador;
        const resultado = {
            tipoRolagem: 'INICIATIVA',
            rolagens: [{ dado: 'd20', resultado: roll }],
            modificadores: modificador,
            total,
            detalhes: [`1d20:[${roll}]`, `Mod:[${modificador >= 0 ? '+' : ''}${modificador}]`]
        };
        await registrarRolagem({ guildId, userId, username, expressao: `iniciativa`, ...resultado });
        const listaOrdenada = await this.setarIniciativa(guildId, userId, username, total);
        return { rolagem: { total, detalhes: resultado.detalhes }, ...listaOrdenada };
    },

    async obterEstatisticas(guildId, userId) {
        const collection = getRolagensHistoricoCollection();
        const pipeline = [
            { $match: { guildId, userId } },
            { $unwind: "$rolagens" },
            {
                $group: {
                    _id: { tipoRolagem: "$tipoRolagem", dado: "$rolagens.dado" },
                    media: { $avg: "$rolagens.resultado" },
                    totalRolagens: { $sum: 1 },
                }
            },
            {
                $group: {
                    _id: "$_id.tipoRolagem",
                    statsPorDado: {
                        $push: {
                            dado: "$_id.dado",
                            media: { $round: ["$media", 2] },
                            totalRolagens: "$totalRolagens"
                        }
                    },
                    totalRolagensDoTipo: { $sum: "$totalRolagens" }
                }
            },
            {
                $project: {
                    _id: 0,
                    tipo: "$_id",
                    totalRolagens: "$totalRolagensDoTipo",
                    estatisticas: "$statsPorDado"
                }
            }
        ];
        const stats = await collection.aggregate(pipeline).toArray();
        if (stats.length === 0) {
            throw new Error('Nenhuma estatística de rolagem encontrada para este usuário.');
        }
        return stats;
    },

    // --- FUNÇÕES DE INICIATIVA (AGORA USANDO REDIS) ---
    async listarIniciativas(guildId) {
        const redisKey = `iniciativa:${guildId}`;
        const iniciativaMap = await redisClient.hGetAll(redisKey);
        const listaIniciativa = Object.entries(iniciativaMap).map(([userId, userData]) => {
            const parsedData = JSON.parse(userData);
            return { userId, ...parsedData };
        });
        const listaOrdenada = listaIniciativa.sort((a, b) => b.valor - a.valor);
        if (listaOrdenada.length === 0) {
            throw new Error('Não há iniciativas para listar.');
        }
        return { listaOrdenada };
    },

    async limparIniciativas(guildId) {
        await redisClient.del(`iniciativa:${guildId}`);
        return { message: 'Lista de iniciativas limpa com sucesso.' };
    },

    async setarIniciativa(guildId, userId, username, valor) {
        const redisKey = `iniciativa:${guildId}`;
        await redisClient.hSet(redisKey, userId, JSON.stringify({ username, valor }));
        return await this.listarIniciativas(guildId);
    },

    async removerIniciativa(guildId, userId) {
        const redisKey = `iniciativa:${guildId}`;
        const result = await redisClient.hDel(redisKey, userId);
        if (result === 0) {
            throw new Error('Utilizador não encontrado na lista de iniciativa.');
        }
        return { message: `Utilizador ${userId} removido da iniciativa.` };
    },
};