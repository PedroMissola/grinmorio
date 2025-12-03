/**
 * @param {object}
 * @param {number}
 * @param {string}
 * @param {string}
 */
function sendErrorResponse(res, statusCode, title, message) {
  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    title,
    message,
    timestamp: new Date().toISOString(),
  });
}

function globalErrorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  const title = err.title || 'Erro Interno do Servidor';
  const message = err.message || 'Ocorreu um erro inesperado no servidor. Tente novamente mais tarde.';

  console.error(`❌ Erro [${statusCode}] em ${req.method} ${req.path}:`, err);
  
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    sendErrorResponse(res, 500, title, 'Ocorreu um erro interno. A equipe técnica foi notificada.');
  } else {
    sendErrorResponse(res, statusCode, title, message);
  }
}

module.exports = {
  sendErrorResponse,
  globalErrorHandler,
};