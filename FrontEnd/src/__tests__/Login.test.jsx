import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import { login } from '../services/api.js';

vi.mock('../services/api.js', () => ({
  login: vi.fn(),
  default: { post: vi.fn() },
}));
vi.mock('@react-oauth/google', () => ({ useGoogleLogin: () => vi.fn() }));
vi.mock('../components/Header.jsx', () => ({ default: () => <header>ASIS</header> }));

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/administrador" element={<p>Panel administrador</p>} />
        <Route path="/instructor" element={<p>Panel instructor</p>} />
      </Routes>
    </MemoryRouter>
  );
}

function llenarFormulario() {
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'qa@example.test' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'ClaveSegura#2026' } });
  fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
}

describe('Login ASIS (integración de componentes)', () => {
  beforeEach(() => vi.mocked(login).mockReset());

  test('login válido del instructor conserva sesión y redirige', async () => {
    vi.mocked(login).mockResolvedValue({
      access_token: 'jwt-simulado', rol: 'instructor', id_usuario: 10,
    });
    renderizar();
    llenarFormulario();
    await screen.findByText('Panel instructor');
    expect(login).toHaveBeenCalledWith('qa@example.test', 'ClaveSegura#2026');
    expect(localStorage.getItem('access_token')).toBe('jwt-simulado');
    expect(JSON.parse(localStorage.getItem('usuario')).rol).toBe('instructor');
  });

  test('credenciales incorrectas muestran error sin guardar token', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Correo o contraseña incorrectos'));
    renderizar();
    llenarFormulario();
    await waitFor(() => expect(screen.getByText('Correo o contraseña incorrectos')).toBeInTheDocument());
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
