import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const { API_BASE_URL } = process.env;

if (!API_BASE_URL) {
  throw new Error('A variável de ambiente API_BASE_URL não está definida.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;