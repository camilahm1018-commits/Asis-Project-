import http from 'k6/http';
import { check } from 'k6';

// Solo hosts locales por defecto para que una prueba de estrés no alcance producción.
export const API = (__ENV.ASIS_QA_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
export const UI = (__ENV.ASIS_QA_UI_URL || 'http://127.0.0.1:5173').replace(/\/+$/, '');
const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;
for (const url of [API, UI]) {
  if (!local.test(url) && __ENV.ASIS_QA_PERMITIR_REMOTO !== 'SI') {
    throw new Error(`Carga/estrés bloqueados fuera de localhost: ${url}. Usa ASIS_QA_PERMITIR_REMOTO=SI solo en un entorno de pruebas autorizado.`);
  }
}

export function backend() {
  const salud = http.get(`${API}/`, { tags: { componente: 'backend', recurso: 'salud' } });
  check(salud, { 'backend GET / = 200': r => r.status === 200 });
  const token = __ENV.ASIS_QA_TOKEN;
  if (token) {
    // Solo consulta; NUNCA crea, edita ni elimina tickets.
    const tickets = http.get(`${API}/tickets/`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { componente: 'backend', recurso: 'tickets' },
    });
    check(tickets, { 'tickets autenticados = 200': r => r.status === 200 });
  }
}

export function frontend() {
  const html = http.get(`${UI}/`, { tags: { componente: 'frontend', recurso: 'html' } });
  check(html, { 'front entrega HTML': r => r.status === 200 && String(r.body).includes('html') });
  // ASIS usa Vite en desarrollo: validar su módulo de entrada, sin ejecutar JS.
  const entrada = http.get(`${UI}/src/main.jsx`, {
    tags: { componente: 'frontend', recurso: 'modulo-vite' },
  });
  check(entrada, { 'front entrega main.jsx': r => r.status === 200 });
}
