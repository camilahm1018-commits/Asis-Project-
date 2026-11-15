import { beforeEach, describe, expect, test } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api, { login, logout } from '../services/api.js';

const mock = new MockAdapter(api);
beforeEach(() => mock.reset());

describe('Axios y autenticación (regresión)', () => {
  test('el login envía username/password al endpoint correcto', async () => {
    mock.onPost('/auth/login').reply(config => {
      const parametros = new URLSearchParams(config.data);
      expect(parametros.get('username')).toBe('qa@example.test');
      expect(parametros.get('password')).toBe('Clave#2026');
      return [200, { access_token: 'token-qa', rol: 'administrador' }];
    });
    const respuesta = await login('qa@example.test', 'Clave#2026');
    expect(respuesta.access_token).toBe('token-qa');
  });

  test('adjunta el Bearer Token a las consultas', async () => {
    localStorage.setItem('access_token', 'token-simulado');
    mock.onGet('/tickets/').reply(config => {
      expect(config.headers.Authorization).toBe('Bearer token-simulado');
      return [200, []];
    });
    const r = await api.get('/tickets/');
    expect(r.status).toBe(200);
  });

  test('el logout borra credenciales guardadas', () => {
    localStorage.setItem('access_token', 'uno');
    localStorage.setItem('usuario', '{"rol":"tecnico"}');
    logout();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
  });

  test('si la API rechaza con 401 elimina la sesión local', async () => {
    localStorage.setItem('access_token', 'expirado');
    localStorage.setItem('usuario', '{"rol":"instructor"}');
    mock.onGet('/tickets/').reply(401, { detail: 'Token expirado' });
    await expect(api.get('/tickets/')).rejects.toBeTruthy();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
  });
});
