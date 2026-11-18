import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import { login } from '../services/api.js';

vi.mock('../services/api.js', () => ({
  login: vi.fn(),
  default: { post: vi.fn() },
}));
vi.mock('@react-oauth/google', () => ({ useGoogleLogin: () => vi.fn() }));
vi.mock('../components/Header.jsx', () => ({ default: () => <header>ASIS QA</header> }));

function formulario() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/administrador" element={<p>Administrador QA</p>} />
        <Route path="/mesa-ayuda/panel" element={<p>Mesa QA</p>} />
        <Route path="/tecnico" element={<p>Técnico QA</p>} />
        <Route path="/instructor" element={<p>Instructor QA</p>} />
        <Route path="/cuentadante" element={<p>Cuentadante QA</p>} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'qa@example.test' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'UnaClaveDeQA#2026' } });
  fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
}

describe('Login de los cinco perfiles', () => {
  beforeEach(() => vi.mocked(login).mockReset());

  test.each([
    ['administrador', 'Administrador QA'],
    ['administrador_mesa_ayuda', 'Mesa QA'],
    ['tecnico', 'Técnico QA'],
    ['instructor', 'Instructor QA'],
    ['cuentadante', 'Cuentadante QA'],
  ])('redirige %s al panel esperado', async (rol, panel) => {
    vi.mocked(login).mockResolvedValue({ access_token: 'token-qa', id_usuario: 100, rol });
    formulario();
    expect(await screen.findByText(panel)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('usuario')).rol).toBe(rol);
    expect(localStorage.getItem('access_token')).toBe('token-qa');
  });
});
