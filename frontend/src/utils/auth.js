import api from './api';

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem('user');
};

export const hasRole = (role) => {
  const user = getUser();
  return user && user.roles && user.roles.includes(role);
};

export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = '/login';
};

// Rafraîchir les données utilisateur depuis le serveur
export const refreshUser = async () => {
  try {
    const token = getToken();
    if (!token) return null;
    
    const response = await api.get('/auth/me');
    const userData = response.data;
    setUser(userData);
    return userData;
  } catch (error) {
    console.error('Error refreshing user data:', error);
    // Si erreur 401, déconnecter l'utilisateur
    if (error.response?.status === 401) {
      logout();
    }
    return null;
  }
};

// Vérifier et rafraîchir les rôles au chargement de la page
export const checkAndRefreshUser = async () => {
  const token = getToken();
  if (!token) return null;
  
  // Rafraîchir les données utilisateur
  return await refreshUser();
};
