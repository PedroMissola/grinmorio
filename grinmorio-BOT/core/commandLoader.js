import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import log from '../utils/logger.js';
import { sendLog } from '../utils/analytics.js'; // NOVO

/**
 * @param {string} dirPath - O caminho para o diretório a ser lido.
 * @returns {string[]} Um array com os caminhos completos de todos os arquivos de comando.
 */
function getCommandFiles(dirPath) {
  let commandFiles = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      commandFiles = commandFiles.concat(getCommandFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      commandFiles.push(fullPath);
    }
  }
  return commandFiles;
}

/**
 * Valida se um objeto de comando tem a estrutura correta
 * @param {*} commandObject Objeto do comando
 * @param {string} fileName Nome do arquivo
 * @returns {boolean} True se válido
 */
function isValidCommand(commandObject, fileName) {
  if (!commandObject || typeof commandObject !== 'object') {
    log.warn(`Comando ${fileName}: objeto inválido ou null`);
    return false;
  }
  if (!commandObject.data) {
    log.warn(`Comando ${fileName}: propriedade 'data' não encontrada`);
    return false;
  }
  if (!commandObject.execute || typeof commandObject.execute !== 'function') {
    log.warn(`Comando ${fileName}: propriedade 'execute' não é uma função`);
    return false;
  }
  const commandName = commandObject.data.name;
  if (!commandName || typeof commandName !== 'string') {
    log.warn(`Comando ${fileName}: nome do comando inválido`);
    return false;
  }
  if (!/^[a-z0-9-_]{1,32}$/.test(commandName)) {
    log.warn(`Comando ${fileName}: nome "${commandName}" contém caracteres inválidos ou é muito longo`);
    return false;
  }
  return true;
}

/**
 * Extrai o objeto de comando de um módulo importado
 * @param {*} command Módulo importado
 * @param {string} fileName Nome do arquivo
 * @returns {object|null} Objeto do comando ou null
 */
function extractCommandObject(command, fileName) {
  try {
    let commandObject = null;
    if (command.default && isValidCommand(command.default, fileName)) {
      commandObject = command.default;
    } else if (isValidCommand(command, fileName)) {
      commandObject = command;
    }
    if (!commandObject) {
      log.warn(`Comando ${fileName}: estrutura inválida ou incompleta`);
      return null;
    }
    return commandObject;
  } catch (error) {
    log.error(`Erro ao extrair comando de ${fileName}:`, error);
    return null;
  }
}

/**
 * Converte o comando para formato JSON da API do Discord
 * @param {object} commandObject Objeto do comando
 * @param {string} fileName Nome do arquivo
 * @returns {object|null} Dados do comando em JSON ou null
 */
function commandToJSON(commandObject, fileName) {
  try {
    if (typeof commandObject.data.toJSON === 'function') {
      return commandObject.data.toJSON();
    }
    if (typeof commandObject.data === 'object') {
      return commandObject.data;
    }
    log.warn(`Comando ${fileName}: não foi possível converter data para JSON`);
    return null;
  } catch (error) {
    log.error(`Erro ao converter comando ${fileName} para JSON:`, error);
    return null;
  }
}

/**
 * Carrega todos os comandos do diretório
 * @param {client} client Cliente do Discord
 * @param {string} projectDir Diretório raiz do projeto
 * @returns {Promise<boolean>} True se carregou com sucesso
 */
export default async function loadCommands(client, projectDir) {
  const commandsToRegister = [];
  const commandsPath = path.join(projectDir, 'commands');

  if (!client || !client.commands) {
    log.error('Client inválido ou sem coleção de comandos');
    return false;
  }

  const { CLIENT_ID, DISCORD_TOKEN } = process.env;
  if (!CLIENT_ID || !DISCORD_TOKEN) {
    log.error('CLIENT_ID ou DISCORD_TOKEN não encontrado no arquivo .env');
    return false;
  }

  try {
    if (!fs.existsSync(commandsPath)) {
      log.error(`Diretório de comandos não encontrado: ${commandsPath}`);
      return false;
    }

    // *** ALTERAÇÃO PRINCIPAL AQUI ***
    // Usa a nova função para buscar arquivos em subdiretórios
    const commandFiles = getCommandFiles(commandsPath);

    if (commandFiles.length === 0) {
      log.warn('Nenhum arquivo de comando encontrado');
      return true;
    }

    log.info(`📁 Encontrados ${commandFiles.length} arquivos de comando`);

    for (const filePath of commandFiles) {
      const fileName = path.basename(filePath);
      try {
        const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
        const command = await import(fileUrl);
        const commandObject = extractCommandObject(command, fileName);
        if (!commandObject) continue;

        const commandData = commandToJSON(commandObject, fileName);
        if (!commandData) continue;

        const commandName = commandObject.data.name;
        if (client.commands.has(commandName)) {
          log.warn(`Comando duplicado encontrado: ${commandName} (em ${fileName})`);
          continue;
        }

        client.commands.set(commandName, commandObject);
        commandsToRegister.push(commandData);
        log.info(`✅ Comando carregado: ${commandName}`);
      } catch (fileError) {
        log.error(`Erro ao carregar arquivo ${fileName}:`, fileError);
        sendLog('error', 'Falha ao carregar ficheiro de comando', {
          fileName: fileName,
          errorMessage: fileError.message,
          stack: fileError.stack,
        });
      }
    }

    log.info(`📋 Total de comandos carregados: ${client.commands.size}/${commandFiles.length}`);

    if (commandsToRegister.length === 0) {
      log.warn('Nenhum comando válido foi carregado');
      return false;
    }

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    log.info(`🚀 Registrando ${commandsToRegister.length} comandos na API do Discord...`);

    const data = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commandsToRegister },
    );

    log.info(`✅ ${data.length} comandos registrados com sucesso na API do Discord!`);
    return true;

  } catch (error) {
    log.error('❌ Erro fatal ao carregar ou registrar comandos:', error);
    sendLog('error', 'Erro fatal no commandLoader', {
      errorMessage: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Recarrega um comando específico (útil para hot-reload em desenvolvimento)
 * @param {Client} client Cliente do Discord
 * @param {string} commandName Nome do comando a recarregar
 * @param {string} projectDir Diretório raiz do projeto
 * @returns {Promise<boolean>} True se recarregou com sucesso
 */
export async function reloadCommand(client, commandName, projectDir) {
  try {
    if (!client || !client.commands) {
      log.error('Client inválido');
      return false;
    }

    if (!commandName || typeof commandName !== 'string') {
      log.error('Nome de comando inválido');
      return false;
    }

    const commandsPath = path.join(projectDir, 'commands');
    const filePath = path.join(commandsPath, `${commandName}.js`);

    if (!fs.existsSync(filePath)) {
      log.error(`Arquivo do comando não encontrado: ${filePath}`);
      return false;
    }

    // Remove do cache do Node
    delete require.cache[require.resolve(filePath)];

    // Reimporta
    const fileUrl = `file://${filePath.replace(/\\/g, '/')}?update=${Date.now()}`;
    const command = await import(fileUrl);

    const commandObject = extractCommandObject(command, `${commandName}.js`);
    if (!commandObject) {
      return false;
    }

    // Atualiza na coleção
    client.commands.set(commandName, commandObject);

    log.info(`✅ Comando ${commandName} recarregado com sucesso`);
    return true;
  } catch (error) {
    log.error(`Erro ao recarregar comando ${commandName}:`, error);
    return false;
  }
}