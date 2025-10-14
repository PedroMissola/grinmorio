import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// A URL da API será injetada pelo Docker Compose ou de um ficheiro .env.local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    if (response.data.token) {
        localStorage.setItem('grinmorioToken', response.data.token);
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('grinmorioToken');
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('grinmorioToken');
    if (!token) return false;
    
    try {
        const decoded = jwtDecode(token);
        // Verifica se o token expirou
        return decoded.exp * 1000 > Date.now();
    } catch { // CORREÇÃO: Variável 'e' removida
        return false;
    }
};

export const getUser = () => {
    const token = localStorage.getItem('grinmorioToken');
    if (!token) return null;
    try {
        return jwtDecode(token);
    } catch { // CORREÇÃO: Variável 'e' removida
        return null;
    }
};