// src/services/sesion.js
export const CLAVE_ACTIVIDAD = 'asis_ultima_actividad';

export function limpiarSesion() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
}