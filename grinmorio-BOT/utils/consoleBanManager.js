import readline from 'readline';
import { EmbedBuilder } from 'discord.js';
import api from './api.js';

let botClient; // Variável para guardar a instância do client

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'D&D Bot > '
});

function isValidDiscordId(userId) {
  return /^\d{17,19}$/.test(userId);
}

// --- Funções de Console Refatoradas para Usar a API ---

async function banViaConsole(args) {
  const userId = args[0];
  const reason = args.slice(1).join(' ') || 'Banido via console';

  if (!userId || !isValidDiscordId(userId)) {
    return console.log('Formato inválido. Uso: ban <userId> [motivo]');
  }

  try {
    const { data } = await api.post('/usuarios/ban', { userId, reason });
    console.log(`${data.message}`);
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Falha ao banir o usuário.';
    console.error(`${errorMessage}`);
  }
}

async function unbanViaConsole(args) {
  const userId = args[0];

  if (!userId || !isValidDiscordId(userId)) {
    return console.log('Formato inválido. Uso: unban <userId>');
  }

  try {
    const { data } = await api.post('/usuarios/unban', { userId });
    console.log(`${data.message}`);
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Falha ao desbanir o usuário.';
    console.error(`${errorMessage}`);
  }
}

async function checkViaConsole(args) {
  const userId = args[0];

  if (!userId || !isValidDiscordId(userId)) {
    return console.log('Formato inválido. Uso: check <userId>');
  }

  try {
    const { data } = await api.get(`/usuarios/${userId}/status`);
    if (data.isBanned) {
      console.log(`Usuário ${userId} ESTÁ banido.`);
    } else {
      console.log(`Usuário ${userId} NÃO está banido.`);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Falha ao verificar o status do usuário.';
    console.error(`${errorMessage}`);
  }
}

async function listarViaConsole() {
  try {
    const { data: banidos } = await api.get('/usuarios/list');
    if (banidos.length === 0) {
      return console.log('Nenhum usuário está banido no momento.');
    }

    console.log(`\nLista de usuários banidos (${banidos.length}):`);
    console.log('─'.repeat(70));
    banidos.forEach((ban) => {
      const data = new Date(ban.bannedAt).toLocaleString('pt-BR');
      console.log(`ID: ${ban.userId}\n  Motivo: ${ban.reason}\n  Data: ${data}\n`);
    });
    console.log('─'.repeat(70));
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Falha ao listar os usuários banidos.';
    console.error(`${errorMessage}`);
  }
}

/** Mostra um resumo da ficha de um utilizador. */
async function findViaConsole(args) {
  const userId = args[0];
  const guildId = '1230675261419159562'; // Coloque aqui o ID do seu servidor principal

  if (!isValidDiscordId(userId)) return console.log('Uso: find <userId>');
  if (guildId === 'ID_DO_SEU_SERVIDOR_PRINCIPAL') return console.log('AVISO: Configure o ID do servidor principal no comando "find".');

  try {
    const { data: p } = await api.get(`/personagens/${guildId}/${userId}`);
    console.log(`\n--- Ficha de ${p.nome} (${userId}) ---`);
    console.log(`  Raça: ${p.raca} | Classe: ${p.classe} | Nível: ${p.nivel}`);
    console.log(`  Atributos: FOR:${p.atributos.forca} DES:${p.atributos.destreza} CON:${p.atributos.constituicao} INT:${p.atributos.inteligencia} SAB:${p.atributos.sabedoria} CAR:${p.atributos.carisma}`);
    console.log(`------------------------------------`);
  } catch (error) {
    console.log(`❌ Ficha não encontrada para o utilizador ${userId} no servidor configurado.`);
  }
}

/** Apaga a ficha de um utilizador, com confirmação. */
async function deleteCharViaConsole(args) {
  const userId = args[0];
  const guildId = '1230675261419159562'; // Coloque aqui o ID do seu servidor principal

  if (!isValidDiscordId(userId)) return console.log('Uso: delete-char <userId>');
  if (guildId === 'ID_DO_SEU_SERVIDOR_PRINCIPAL') return console.log('AVISO: Configure o ID do servidor principal no comando "delete-char".');

  rl.question(`Tem a certeza que quer APAGAR a ficha do utilizador ${userId}? (sim/não) `, async (answer) => {
    if (answer.toLowerCase() === 'sim') {
      try {
        await api.delete(`/personagens/${guildId}/${userId}`);
        console.log(`Ficha do utilizador ${userId} apagada com sucesso.`);
      } catch (error) {
        console.log('Ficha não encontrada ou erro ao apagar.');
      }
    } else {
      console.log('Operação cancelada.');
    }
    rl.prompt();
  });
}

/** Envia uma mensagem para um canal específico em todos os servidores. */
async function broadcastViaConsole(args) {
  const channelName = args[0];
  const message = args.slice(1).join(' ');

  if (!channelName || !message) return console.log('Uso: broadcast <nome-do-canal> <mensagem>');

  console.log(`A enviar broadcast para os canais #${channelName}...`);
  let count = 0;

  botClient.guilds.cache.forEach(guild => {
    const channel = guild.channels.cache.find(c => c.name === channelName && c.isTextBased());
    if (channel) {
      try {
        // const embed = new EmbedBuilder().setTitle('📢 Anúncio').setDescription(message).setColor(0xFFD700);
        // channel.send({ embeds: [embed] });
        channel.send(message);
        count++;
      } catch (error) {
        console.log(`Falha ao enviar para ${guild.name}: Sem permissão.`);
      }
    }
  });
  console.log(`Mensagem enviada para ${count} servidor(es).`);
}

/** Envia uma Mensagem Direta (DM) para um utilizador. */
async function dmViaConsole(args) {
  const userId = args[0];
  const message = args.slice(1).join(' ');

  if (!isValidDiscordId(userId) || !message) return console.log('Uso: dm <userId> <mensagem>');

  try {
    const user = await botClient.users.fetch(userId);
    await user.send(`**Uma mensagem do administrador do bot:**\n>>> ${message}`);
    console.log(`DM enviada com sucesso para ${user.tag}.`);
  } catch (error) {
    console.log(`Falha ao enviar DM para ${userId}. O utilizador pode não ser alcançável.`);
  }
}

/** Mostra estatísticas do bot. */
function statsViaConsole() {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  console.log('\n--- Estatísticas do Bot ---');
  console.log(`  Servidores: ${botClient.guilds.cache.size}`);
  console.log(`  Utilizadores (em cache): ${botClient.users.cache.size}`);
  console.log(`  Tempo de Atividade: ${hours}h ${minutes}m`);
  console.log(`  Uso de Memória: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log('---------------------------');
}

/** Testa a conexão com a API. */
async function pingApi() {
  try {
    const startTime = Date.now();
    await api.get('/health');
    const endTime = Date.now();
    console.log(`API está online! Tempo de resposta: ${endTime - startTime}ms`);
  } catch (error) {
    console.log('Falha ao comunicar com a API. Verifique se o servidor backend está a correr.');
  }
}

/** Limpa a tela do console. */
function clearViaConsole() {
  console.clear();
}

/** Encerra a conexão do bot e o processo de forma limpa. */
async function stopViaConsole() {
  console.log('Encerrando o bot...');
  await botClient.destroy();
  rl.close();
}

/** Define um valor de iniciativa para um utilizador num servidor. */
async function initSetViaConsole(args) {
  const [guildId, userId, username, valor] = args;
  if (!guildId || !userId || !username || !valor) {
    return console.log('Uso: init-set <guildId> <userId> <username> <valor>');
  }
  try {
    const { data } = await api.put('/rolagens/iniciativa', { guildId, userId, username, valor });
    console.log(`✅ ${data.message}`);
  } catch (error) {
    console.error(`❌ ${error.response?.data?.message || 'Falha ao definir iniciativa.'}`);
  }
}

/** Remove um utilizador da iniciativa de um servidor. */
async function initRemoveViaConsole(args) {
  const [guildId, userId] = args;
  if (!guildId || !userId) {
    return console.log('Uso: init-remove <guildId> <userId>');
  }
  try {
    const { data } = await api.delete(`/rolagens/iniciativa/${guildId}/${userId}`);
    console.log(`✅ ${data.message}`);
  } catch (error) {
    console.error(`❌ ${error.response?.data?.message || 'Falha ao remover da iniciativa.'}`);
  }
}

/** Lista a iniciativa de um servidor específico. */
async function initListViaConsole(args) {
  const [guildId] = args;
  if (!guildId) return console.log('Uso: init-list <guildId>');

  try {
    const { data } = await api.get(`/rolagens/iniciativa/${guildId}`);
    if (data.listaOrdenada.length === 0) {
      return console.log(`✅ A lista de iniciativa para o servidor ${guildId} está vazia.`);
    }
    console.log(`\n--- Ordem de Iniciativa [Servidor: ${guildId}] ---`);
    data.listaOrdenada.forEach((item, i) => {
      console.log(`  ${i + 1}º - ${item.username} (${item.userId}) - Valor: ${item.valor}`);
    });
    console.log(`-------------------------------------------`);
  } catch (error) {
    console.log(`❌ Não há iniciativas registadas para o servidor ${guildId}.`);
  }
}

/** Mostra a ajuda atualizada. */
function mostrarAjuda() {
  console.log('\nConsole Manager - Comandos:');
  console.log('─'.repeat(50));
  console.log('  ban <userId> [motivo]                            - Bane um utilizador de usar o bot.');
  console.log('  unban <userId>                                   - Desbane um utilizador.');
  console.log('  check <userId>                                   - Verifica o estado de ban de um utilizador.');
  console.log('  list                                             - Mostra a lista de utilizadores banidos.');
  console.log('  find <userId>                                    - Mostra um resumo da ficha de um utilizador.');
  console.log('  delete-char <userId>                             - Apaga a ficha de um utilizador.');
  console.log('  say <canal> <msg>                                - Envia um anúncio global.');
  console.log('  dm <userId> <msg>                                - Envia uma DM para um utilizador.');
  console.log('  stats                                            - Mostra estatísticas do bot.');
  console.log('  ping-api                                         - Testa a conexão com a sua API.');
  console.log('  clear / cls                                      - Limpa a tela do console.'); // COMANDO NOVO
  console.log('  help                                             - Mostra esta ajuda.');
  console.log('  stop                                             - Para o bot de forma segura.');
  console.log('  init-set <guildId> <userId> <nome> <valor>       - Adiciona ou edita um jogador na iniciativa.');
  console.log('  init-remove <guildId> <userId>                   - Remove um jogador da iniciativa.');
  console.log('  init-list <guildId>                              - Lista a ordem de iniciativa de um servidor.');
  console.log('─'.repeat(50));
}

/** Processa todos os comandos do console. */
async function processarComando(comando) {
  const [acao, ...args] = comando.split(' ');
  switch (acao.toLowerCase()) {
    case 'ban': await banViaConsole(args); break;
    case 'unban': await unbanViaConsole(args); break;
    case 'check': await checkViaConsole(args); break;
    case 'list': await listViaConsole(); break;
    case 'find': await findViaConsole(args); break;
    case 'delete-char': await deleteCharViaConsole(args); break;
    case 'say': await broadcastViaConsole(args); break;
    case 'dm': await dmViaConsole(args); break;
    case 'stats': statsViaConsole(); break;
    case 'ping-api': await pingApi(); break;
    case 'help': mostrarAjuda(); break;
    case 'stop': await stopViaConsole(); break;
    case 'clear': case 'cls': clearViaConsole(); break; // COMANDO NOVO
    case 'exit': case 'quit': rl.close(); break;
    case 'init-set': await initSetViaConsole(args); break;
    case 'init-remove': await initRemoveViaConsole(args); break;
    case 'init-list': await initListViaConsole(args); break;
    default:
      if (comando.length > 0) {
        console.log(`Comando "${acao}" não reconhecido. Digite "help" para ajuda.`);
      }
      break;
  }
}

/** Função de inicialização, agora recebe o client. */
export function iniciarConsoleManager(client) {
  botClient = client;
  console.log('\nConsole Ban Manager (Modo API) iniciado!');
  console.log('Digite "help" para ver os comandos disponíveis\n');
  rl.prompt();

  rl.on('line', async (input) => {
    await processarComando(input.trim());
    if (rl.closed) return;
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('Bot encerrado.');
    if (botClient && botClient.readyTimestamp) {
      botClient.destroy();
    }
    process.exit(0);
  });
}