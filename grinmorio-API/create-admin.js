import readline from 'readline';
import { connectToDatabase } from './src/utils/database.js'; // Caminho corrigido
import { authService } from './src/api/auth/auth.service.js';    // Caminho corrigido
import logger from './src/utils/logger.js';                    // Caminho corrigido

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function run() {
    await connectToDatabase();

    rl.question('Nome do utilizador admin: ', (username) => {
        rl.question('Palavra-passe: ', async (password) => {
            try {
                // CORREÇÃO: Usar a função 'register' e passar os argumentos separadamente
                await authService.register(username, password, 'admin');
                logger.success(`Utilizador admin '${username}' criado com sucesso!`);
            } catch (error) {
                logger.error('Erro ao criar utilizador:', error.message);
            } finally {
                rl.close();
                process.exit(0);
            }
        });
    });
}

run();