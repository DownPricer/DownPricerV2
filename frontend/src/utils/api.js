import axios from 'axios';
import { getToken } from './auth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
// En production avec Nginx, BACKEND_URL est vide ou '/api', on utilise directement '/api'
const API = BACKEND_URL && BACKEND_URL !== '/api' ? `${BACKEND_URL}/api` : '/api';

const axiosInstance = axios.create({
  baseURL: API,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;