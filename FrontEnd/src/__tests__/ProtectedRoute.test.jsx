import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

const montar = (ruta = '/administrador/usuarios') => render(
  <MemoryRouter initialEntries={[ruta]}>
    <Routes>
      <Route path="/login" element={<p>Página login</p>} />
      <Route path="/instructor" element={<p>Panel instructor</p>} />
      <Route path="/administrador/usuarios" element={
        <ProtectedRoute roles={['administrador']}><p>Panel usuarios</p></ProtectedRoute>
      } />
    </Routes>
  </MemoryRouter>
);

describe('ProtectedRoute (unitarias de React)', () => {
  test('sin token redirige a login', () => {
    montar();
    expect(screen.getByText('Página login')).toBeInTheDocument();
  });

  test('administrador autenticado puede consultar usuarios', () => {
    localStorage.setItem('access_token', 'jwt-falso-para-ui');
    localStorage.setItem('usuario', JSON.stringify({ rol: 'administrador' }));
    montar();
    expect(screen.getByText('Panel usuarios')).toBeInTheDocument();
  });

  test('instructor no puede ver la pantalla administrativa', () => {
    localStorage.setItem('access_token', 'jwt-falso-para-ui');
    localStorage.setItem('usuario', JSON.stringify({ rol: 'instructor' }));
    montar();
    expect(screen.getByText('Panel instructor')).toBeInTheDocument();
    expect(screen.queryByText('Panel usuarios')).not.toBeInTheDocument();
  });

  test('perfil guardado con JSON inválido vuelve al login', () => {
    localStorage.setItem('access_token', 'jwt-falso-para-ui');
    localStorage.setItem('usuario', 'mal-json');
    montar();
    expect(screen.getByText('Página login')).toBeInTheDocument();
  });
});
