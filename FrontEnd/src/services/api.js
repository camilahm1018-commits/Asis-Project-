import axios from 'axios';

// Mantiene localhost, pero funciona también cuando abres el FrontEnd por la IP del PC.
export const API_BASE_URL = (import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`).replace(/\/$/, '');

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 &&
        !String(error.config?.url || '').includes('/auth/login') &&
        !String(error.config?.url || '').includes('/auth/google-login')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export const login = async (correo, contrasena) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', correo);
    formData.append('password', contrasena);
    const { data } = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  } catch (error) {
    if (error.response?.data) {
      throw new Error(error.response.data.detail || 'Error al iniciar sesión');
    }
    throw new Error('No se pudo conectar con el servidor');
  }
};

export const getToken = () => localStorage.getItem('access_token');

export const getAuthHeaders = () => {
  const token = getToken();
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
};

export default api;
