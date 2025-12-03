const jwt = require('jsonwebtoken');
const { sendErrorResponse } = require('../utils/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @param {object}
 * @param {object}
 * @param {Function}
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Se não houver token, nega o acesso
    return sendErrorResponse(res, 401, 'Acesso Não Autorizado', 'Token de autenticação ausente. Forneça um JWT válido.');
  }

  if (!JWT_SECRET) {
    console.error('JWT_SECRET não definido. A autenticação não funcionará corretamente.');
    return sendErrorResponse(res, 500, 'Erro de Configuração', 'A chave secreta JWT não está configurada no servidor.');
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.warn('Tentativa de acesso com token inválido:', err.message);
      return sendErrorResponse(res, 403, 'Token Inválido', 'O token de autenticação é inválido ou expirou.');
    }

    req.user = user;
    next();
  });
};

/**
 * @param {string}
 */
const authorizeRole = (requiredRole) => (req, res, next) => {
  const userRoles = req.user?.acl || [];

  if (userRoles.includes(requiredRole)) {
    next();
  } else {
    sendErrorResponse(res, 403, 'Acesso Proibido', `Você não tem a permissão de "${requiredRole}" necessária para esta ação.`);
  }
};


module.exports = {
    authenticateToken,
    authorizeRole,
};