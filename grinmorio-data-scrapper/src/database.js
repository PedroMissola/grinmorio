// src/database.js - CORRIGIDO
const { MongoClient } = require('mongodb');

// Monta a URI a partir das variáveis de ambiente
const user = process.env.MONGO_USER; // <-- CORRIGIDO
const password = process.env.MONGO_PASSWORD; // <-- CORRIGIDO
const host = process.env.MONGO_HOST;
const dbName = process.env.MONGO_DB_NAME;
const dbPort = process.env.MONGO_PORT;

const uri = `mongodb://${user}:${password}@${host}:${dbPort}/${dbName}?authSource=admin`;

const client = new MongoClient(uri);
let db;

async function connectToDatabase() {
    if (db) return db;
    try {
        await client.connect();
        console.log("✅ Conectado ao MongoDB com sucesso!");
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error("❌ Erro ao conectar ao MongoDB:", error);
        process.exit(1);
    }
}

function getDb() {
    if (!db) {
        throw new Error('Você deve se conectar ao banco de dados primeiro!');
    }
    return db;
}

module.exports = { connectToDatabase, getDb };