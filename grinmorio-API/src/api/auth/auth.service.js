import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDashboardUsersCollection } from '../../utils/database.js'; // Vamos assumir que esta função será criada em database.js
import logger from '../../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const authService = {
  /**
   * Regista um novo utilizador no banco de dados.
   * @param {string} username - Nome do utilizador.
   * @param {string} password - Palavra-passe em texto plano.
   * @param {string} role - Papel/Hierarquia do utilizador (ex: 'admin', 'viewer').
   */
  async register(username, password, role = 'viewer') {
    const usersCollection = getDashboardUsersCollection();

    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      throw new Error('Este nome de utilizador já está em uso.');
    }

    const passwordHash = await bcrypt.hash(password, 10); // 10 é o "salt rounds"

    // 3. Insere o novo utilizador no banco de dados
    const result = await usersCollection.insertOne({
      username,
      passwordHash,
      role,
      createdAt: new Date(),
    });

    logger.info(`Novo utilizador do painel registado: ${username} (Papel: ${role})`);
    return { userId: result.insertedId, username, role };
  },

  /**
   * Autentica um utilizador e retorna um token JWT.
   * @param {string} username - Nome do utilizador.
   * @param {string} password - Palavra-passe em texto plano.
   */
  async login(username, password) {
    const usersCollection = getDashboardUsersCollection();
    const user = await usersCollection.findOne({ username });

    // Compara a palavra-passe fornecida com a hash guardada no banco de dados
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Nome de utilizador ou palavra-passe inválidos.');
    }

    // Se as credenciais estiverem corretas, gera um token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' } // O token é válido por 8 horas
    );

    logger.success(`Utilizador '${username}' autenticado com sucesso.`);
    return { 
        message: 'Login bem-sucedido!',
        token,
        user: {
            username: user.username,
            role: user.role
        }
     };
  },
};