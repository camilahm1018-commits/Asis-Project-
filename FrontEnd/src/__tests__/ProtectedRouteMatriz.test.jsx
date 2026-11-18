import React from 'react';
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

function montar(ruta, roles = ['administrador']) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/privado" element={
          <ProtectedRoute roles={roles}><p>Contenido privado QA</p></ProtectedRoute>
        } />
        <Route path="/login" element={<p>Formulario de login QA</p>} />
        <Route path="/administrador" element={<p>Panel administrador QA</p>} />
        <Route path="/tecnico" element={<p>Panel técnico QA</p>} />
        <Route path="/instructor" element={<p>Panel instructor QA</p>} />
        <Route path="/cuentadante" element={<p>Panel cuentadante QA</p>} />
        <Route path="/mesa-ayuda/panel" element={<p>Panel mesa QA</p>} />
      </Routes>
    </MemoryRouter>
  );
}

function sesion(rol, token = 'token-qa') {
  if (token) localStorage.setItem('access_token', token);
  localStorage.setItem('usuario', JSON.stringify({ rol }));
}

describe('Matriz de protección del FrontEnd', () => {
  beforeEach(() => localStorage.clear());

  test('redirige a login sin token aunque exista un rol', () => {
    sesion('administrador', null);
    montar('/privado');
    expect(screen.getByText('Formulario de login QA')).toBeInTheDocument();
  });

  test('redirige si hay datos corruptos de sesión', () => {
    localStorage.setItem('access_token', 'token-qa');
    localStorage.setItem('usuario', '{mal-json');
    montar('/privado');
    expect(screen.getByText('Formulario de login QA')).toBeInTheDocument();
  });

  test.each([
    ['administrador', 'administrador'],
    ['tecnico', 'tecnico'],
    ['instructor', 'instructor'],
    ['cuentadante', 'cuentadante'],
    ['administrador_mesa_ayuda', 'administrador_mesa_ayuda'],
  ])('permite %s cuando el rol está autorizado', (rol, autorizado) => {
    sesion(rol);
    montar('/privado', [autorizado]);
    expect(screen.getByText('Contenido privado QA')).toBeInTheDocument();
  });

  test.each([
    ['administrador', 'Panel administrador QA'],
    ['tecnico', 'Panel técnico QA'],
    ['instructor', 'Panel instructor QA'],
    ['cuentadante', 'Panel cuentadante QA'],
    ['administrador_mesa_ayuda', 'Panel mesa QA'],
  ])('redirige %s a su propio panel si no tiene permiso', (rol, destino) => {
    sesion(rol);
    montar('/privado', ['rol-no-autorizado']);
    expect(screen.getByText(destino)).toBeInTheDocument();
  });
});
