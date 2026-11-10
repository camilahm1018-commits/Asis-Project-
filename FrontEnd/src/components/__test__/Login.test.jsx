import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../Login'; // Ajusta la ruta si tu componente está en otra subcarpeta (ej. pages/)

describe('Pruebas Unitarias - Componente Login (FrontEnd)', () => {
  
  test('Renderiza correctamente los campos de entrada y el botón de acceso', () => {
    render(<Login />);
    
    // Verifica que existan los inputs y el botón basándose en sus atributos o texto
    expect(screen.getByPlaceholderText(/usuario|correo|username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar|iniciar|login/i })).toBeInTheDocument();
  });

  test('Permite escribir texto en el campo de usuario exitosamente', () => {
    render(<Login />);
    
    const inputUsuario = screen.getByPlaceholderText(/usuario|correo|username/i);
    
    // Simula que el usuario escribe en el input
    fireEvent.change(inputUsuario, { target: { value: 'admin_test' } });
    
    // Valida que el valor se haya actualizado en el input
    expect(inputUsuario.value).toBe('admin_test');
  });

});