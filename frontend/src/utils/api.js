import axios from 'axios';
import { getToken } from './auth';

// Configuration de la base URL pour les requêtes API
// En production, toujours utiliser '/api' (Nginx proxy vers backend)
// En dev local, REACT_APP_BACKEND_URL peut être 'http://localhost:8001'
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';

let API_BASE_URL;
if (isProduction) {
  // En production, toujours utiliser '/api' (pas d'IP hardcodée)
  API_BASE_URL = '/api';
} else if (!BACKEND_URL || BACKEND_URL === '/api') {
  // Dev: pas de BACKEND_URL ou égal à '/api' -> utiliser '/api'
  API_BASE_URL = '/api';
} else if (BACKEND_URL.startsWith('http')) {
  // Dev: URL complète (ex: http://localhost:8001) -> ajouter '/api'
  API_BASE_URL = `${BACKEND_URL}/api`;
} else {
  // Autre cas -> utiliser tel quel
  API_BASE_URL = BACKEND_URL;
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Protection contre le double préfixe /api
    // Si l'URL commence par /api/api, corriger en /api
    if (config.url && config.url.startsWith('/api/api/')) {
      config.url = config.url.replace(/^\/api\/api/, '/api');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;