import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const user = process.env.MONGO_USER;
const password = process.env.MONGO_PASSWORD;
const host = process.env.MONGO_HOST || 'mongodb';
const dbName = process.env.MONGO_DB_NAME;

const uri = `mongodb://${user}:${password}@${host}:27017/${dbName}?authSource=admin`;

const client = new MongoClient(uri);
let db;

export async function connectToDatabase() {
    if (db) return;
    try {
        await client.connect();
        db = client.db(dbName);
        logger.success('✅ Conectado ao MongoDB com sucesso!');
    } catch (error) {
        logger.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}

/** Retorna a coleção de magias */
export function getSpellsCollection() {
    if (!db) throw new Error('Database não conectada!');
    return db.collection('magias');
}

/** Retorna a coleção de personagens */
export function getPersonagensCollection() {
    if (!db) throw new Error('Database não conectada!');
    return db.collection('personagens');
}

/** Retorna a coleção de usuários banidos */
export function getBannedUsersCollection() {
    if (!db) throw new Error('Database não conectada!');
    return db.collection('bannedUsers');
}

/** Retorna a coleção de histórico de rolagens */
export function getRolagensHistoricoCollection() {
    if (!db) throw new Error('Database não conectada!');
    return db.collection('rolagensHistorico');
}

/** Retorna a coleção de estatísticas de rolagens dos usuários (para o sistema de "ajudinha") */
export function getUserRollStatsCollection() {
    if (!db) throw new Error('Database não conectada!');
    return db.collection('userRollStats');
}

/** Retorna a coleção de logs */
export function getLogsCollection() {
    if (!db) throw new Error('Database não conectada!');
    return db.collection('logs');
}

/** Retorna a coleção de configurações de servidores */
export function getGuildsCollection() {
    if (!db) throw new Error('Database não conectada!');
    return db.collection('guilds');
}

/** Retorna a coleção de estatísticas */
export function getStatsCollection() {
    if (!db) throw new Error('Database não conectada!');
    return db.collection('stats');
}

/** Retorna a coleção de utilizadores do painel */
export function getDashboardUsersCollection() {
    if (!db) throw new Error('Database não conectada!');
    return db.collection('dashboard_users');
}