import { beforeEach, describe, expect, test } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api, { getAuthHeaders, getToken, login } from '../services/api.js';

const mock = new MockAdapter(api);

beforeEach(() => {
  mock.reset();
  localStorage.clear();
});

describe('Seguridad del cliente Axios', () => {
  test('sin sesión no envía Authorization', async () => {
    mock.onGet('/tickets/').reply(config => {
      expect(config.headers.Authorization).toBeUndefined();
      return [200, []];
    });
    expect((await api.get('/tickets/')).data).toEqual([]);
    expect(getToken()).toBeNull();
    expect(getAuthHeaders()).toEqual({ headers: {} });
  });

  test('con sesión agrega Bearer a cada petición', async () => {
    localStorage.setItem('access_token', 'qa123');
    mock.onGet('/tickets/').reply(config => {
      expect(config.headers.Authorization).toBe('Bearer qa123');
      return [200, []];
    });
    await api.get('/tickets/');
    expect(getAuthHeaders()).toEqual({ headers: { Authorization: 'Bearer qa123' } });
  });

  test('403 no elimina el token; es una denegación de permisos', async () => {
    localStorage.setItem('access_token', 'token-qa');
    localStorage.setItem('usuario', '{"rol":"instructor"}');
    mock.onGet('/usuarios/').reply(403, { detail: 'No tienes permisos' });
    await expect(api.get('/usuarios/')).rejects.toBeTruthy();
    expect(localStorage.getItem('access_token')).toBe('token-qa');
  });

  test('un 401 del login presenta el mensaje del servidor', async () => {
    mock.onPost('/auth/login').reply(401, { detail: 'Correo o contraseña incorrectos' });
    await expect(login('qa@example.test', 'incorrecta'))
      .rejects.toThrow('Correo o contraseña incorrectos');
  });

  test('error de red de login no muestra secretos y permite reintentar', async () => {
    mock.onPost('/auth/login').networkError();
    await expect(login('qa@example.test', 'una-clave-qa'))
      .rejects.toThrow('No se pudo conectar con el servidor');
  });
});
