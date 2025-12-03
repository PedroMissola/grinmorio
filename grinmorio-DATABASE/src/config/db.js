const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('Erro: Variável de ambiente MONGO_URI não definida. Verifique o .env Global.');
    return;
  }

  try {
    await mongoose.connect(uri);

    console.log('MongoDB: Conexão estabelecida com sucesso.');

    mongoose.connection.on('error', err => {
      console.error('MongoDB: Erro após a inicialização:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB: Conexão perdida. Tentando reconexão automática...');
    });

  } catch (error) {
    console.error('MongoDB: Falha inicial ao conectar:', error.message);
    setTimeout(() => {
      console.log('MongoDB: Tentando reconectar em 5 segundos...');
      connectDB();
    }, 5000); 
  }
}

module.exports = connectDB;