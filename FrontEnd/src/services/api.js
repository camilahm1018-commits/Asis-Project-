import axios from 'axios';

// Configuración base
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// ==========================================
// FUNCIÓN DE LOGIN
// ==========================================
export const login = async (correo, contrasena) => {
  try {
    // ⚠️ CRUCIAL: Tu backend usa OAuth2PasswordRequestForm
    // Esto significa que NO enviamos JSON, sino datos de formulario
    const formData = new URLSearchParams();
    formData.append('username', correo);    // FastAPI espera 'username'
    formData.append('password', contrasena);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;

  } catch (error) {
    // ⚠️ Capturar correctamente los errores de FastAPI
    // FastAPI devuelve: { "detail": "Correo o contraseña incorrectos" }
    if (error.response && error.response.data) {
      const mensajeBackend = error.response.data.detail || 'Error al iniciar sesión';
      throw new Error(mensajeBackend);
    }
    // Si es un error de red o no hay respuesta del servidor
    throw new Error('No se pudo conectar con el servidor');
  }
};

// ==========================================
// FUNCIONES AUXILIARES (opcionales pero útiles)
// ==========================================

// Obtener el token actual
export const getToken = () => {
  return localStorage.getItem('access_token');
};

// Headers para peticiones autenticadas (para usar en otros endpoints)
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Cerrar sesión
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
};

export default api;