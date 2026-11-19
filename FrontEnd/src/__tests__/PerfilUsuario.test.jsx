import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PerfilUsuario from '../components/PerfilUsuario.jsx';
import {
  obtenerMiPerfil,
  obtenerUsuarioActual,
  actualizarMiPerfil,
  solicitarCambioContrasena,
} from '../services/adminService.js';

vi.mock('../services/adminService.js', () => ({
  obtenerMiPerfil: vi.fn(),
  obtenerUsuarioActual: vi.fn(),
  actualizarMiPerfil: vi.fn(),
  solicitarCambioContrasena: vi.fn(),
}));

const PERFIL = {
  id_usuario: 10,
  nombre: 'Ana',
  apellidos: 'Gómez',
  correo: 'ana.gomez@sena.edu.co',
  rol: 'instructor',
  numero_documento: '1012345678',
  tipo_documento: 'CC',
  telefono: '3001112233',
  creado_en: '2026-01-15T10:00:00',
};

async function renderizarPerfil() {
  render(<PerfilUsuario rolLabel="Instructor" />);
  await screen.findByText('Ana Gómez');
}

describe('PerfilUsuario (editar perfil y cambiar contraseña)', () => {
  beforeEach(() => {
    vi.mocked(obtenerMiPerfil).mockReset().mockResolvedValue(PERFIL);
    vi.mocked(obtenerUsuarioActual).mockReset().mockReturnValue({ id_usuario: 10, nombre: 'Ana', apellidos: 'Gómez', rol: 'instructor' });
    vi.mocked(actualizarMiPerfil).mockReset();
    vi.mocked(solicitarCambioContrasena).mockReset();
  });

  test('muestra los datos del usuario', async () => {
    await renderizarPerfil();
    expect(screen.getByText('ana.gomez@sena.edu.co')).toBeInTheDocument();
    expect(screen.getByText('CC 1012345678')).toBeInTheDocument();
    expect(screen.getByText('3001112233')).toBeInTheDocument();
  });

  test('el formulario abre con los datos actuales y deja el correo y el documento bloqueados', async () => {
    await renderizarPerfil();
    fireEvent.click(screen.getByRole('button', { name: /editar perfil/i }));
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana');
    expect(screen.getByLabelText('Apellidos')).toHaveValue('Gómez');
    expect(screen.getByLabelText('Teléfono')).toHaveValue('3001112233');
    expect(screen.getByLabelText('Correo')).toBeDisabled();
    expect(screen.getByLabelText('Documento')).toBeDisabled();
    // sin cambios no se puede guardar
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeDisabled();
  });

  test('guarda los cambios, actualiza la pantalla y avisa a la barra superior', async () => {
    vi.mocked(actualizarMiPerfil).mockResolvedValue({ ...PERFIL, nombre: 'Ana María', telefono: '3009998877' });
    const avisos = vi.fn();
    window.addEventListener('usuario-actualizado', avisos);
    localStorage.setItem('usuario', JSON.stringify({ id_usuario: 10, nombre: 'Ana', apellidos: 'Gómez', rol: 'instructor' }));

    await renderizarPerfil();
    fireEvent.click(screen.getByRole('button', { name: /editar perfil/i }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: ' Ana María ' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '300 999-8877' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await screen.findByText(/tu perfil se actualizó correctamente/i);
    expect(actualizarMiPerfil).toHaveBeenCalledWith({ nombre: 'Ana María', apellidos: 'Gómez', telefono: '3009998877' });
    expect(screen.getByText('Ana María Gómez')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('usuario')).nombre).toBe('Ana María');
    expect(avisos).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /guardar cambios/i })).not.toBeInTheDocument(); // el modal se cierra
    window.removeEventListener('usuario-actualizado', avisos);
  });

  test('valida antes de enviar al backend', async () => {
    await renderizarPerfil();
    fireEvent.click(screen.getByRole('button', { name: /editar perfil/i }));

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    expect(await screen.findByText('El teléfono debe tener entre 7 y 15 dígitos')).toBeInTheDocument();
    expect(actualizarMiPerfil).not.toHaveBeenCalled();
  });

  test('si el backend rechaza el cambio, muestra el error y conserva el formulario abierto', async () => {
    vi.mocked(actualizarMiPerfil).mockRejectedValue(new Error('No se pudo conectar con el servidor'));
    await renderizarPerfil();
    fireEvent.click(screen.getByRole('button', { name: /editar perfil/i }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Otro' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await screen.findByText('No se pudo conectar con el servidor');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Otro');
  });

  test('cambiar contraseña envía el enlace al correo y muestra la confirmación', async () => {
    vi.mocked(solicitarCambioContrasena).mockResolvedValue({
      mensaje: 'Te enviamos un correo a an*******@sena.edu.co con el enlace para cambiar tu contraseña.',
    });
    await renderizarPerfil();
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(screen.getByText('an*******@sena.edu.co')).toBeInTheDocument(); // correo enmascarado (nunca completo)
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));
    await screen.findByText(/te enviamos un correo a an\*+@sena\.edu\.co/i);
    expect(solicitarCambioContrasena).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /reenviar enlace/i })).toBeInTheDocument();
  });

  test('cambiar contraseña muestra el error si no se pudo enviar el correo', async () => {
    vi.mocked(solicitarCambioContrasena).mockRejectedValue(new Error('No se pudo enviar el correo. Inténtalo de nuevo en unos minutos.'));
    await renderizarPerfil();
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));
    await waitFor(() => expect(screen.getByText(/no se pudo enviar el correo/i)).toBeInTheDocument());
  });
});
