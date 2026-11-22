import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import RegistrarEntradaBoton from '../components/RegistrarEntradaBoton.jsx';
import MisTicketsTecnico from '../pages/Tecnico/MisTicketsTecnico.jsx';
import api from '../services/api.js';

let http;

beforeEach(() => { http = new MockAdapter(api); });
afterEach(() => { http.restore(); });

test('el botón de la fila exige confirmar en el formulario de entrada', async () => {
  const actualizar = vi.fn();
  http.onPut('/tickets/12/registrar-entrada').reply(200, { id_ticket: 12 });

  const ticket = { id: 12, equipo: 'Equipo QA', ambiente: 'Aula QA' };
  const { rerender } = render(<RegistrarEntradaBoton ticket={ticket} onRegistrada={actualizar} />);
  expect(screen.queryByRole('button', { name: 'Registrar entrada' })).toBeNull();

  rerender(<RegistrarEntradaBoton ticket={{ ...ticket, puedeRegistrarEntrada: true }} onRegistrada={actualizar} />);
  fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
  const modal = screen.getByRole('dialog', { name: /Registrar entrada/ });
  expect(within(modal).getByText('Equipo QA')).toBeInTheDocument();
  fireEvent.click(within(modal).getByRole('button', { name: 'Confirmar entrada' }));
  await waitFor(() => expect(actualizar).toHaveBeenCalledTimes(1));
  expect(http.history.put).toHaveLength(1);
});

function prepararTecnico(puedeRegistrarEntrada) {
  localStorage.setItem('access_token', 'token-qa');
  localStorage.setItem('usuario', JSON.stringify({ id_usuario: 30, rol: 'tecnico' }));
  const ticket = {
    id_ticket: 12, id_equipo: 1, asignado_a: 30, creado_por: 10, motivo: 'Reporte QA',
    id_estado: puedeRegistrarEntrada ? 3 : 1, puede_registrar_entrada: puedeRegistrarEntrada,
  };
  http.onGet('/tickets/').reply(() => [200, [ticket]]);
  http.onGet('/equipos/').reply(200, [{ id_equipo: 1, nombre: 'Equipo QA', id_ambiente: 20 }]);
  http.onGet('/ambientes/').reply(200, [{ id_ambiente: 20, nombre_a: 'Aula QA' }]);
  http.onGet('/usuarios/resumen').reply(200, [{ id_usuario: 30, nombre_u: 'Técnico', apellidos_u: 'QA' }]);
  http.onGet('/tipo_equipo/tipos-equipo').reply(200, []);
  http.onGet('/notificaciones/usuario/30').reply(200, []);
  http.onGet('/estados_ticket/estados_ticket').reply(200, [
    { id_estado: 1, nombre_e: 'Pendiente' },
    { id_estado: 3, nombre_e: 'Reparado' },
    { id_estado: 4, nombre_e: 'Entregado en ambiente' },
  ]);
  http.onPut('/tickets/12/registrar-entrada').reply(() => {
    ticket.id_estado = 4;
    ticket.puede_registrar_entrada = false;
    return [200, ticket];
  });
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MisTicketsTecnico />
    </MemoryRouter>
  );
}

test('elegir Entregado en ambiente abre la devolución sin guardar el estado general', async () => {
  prepararTecnico(true);
  fireEvent.click(await screen.findByRole('button', { name: /Actualizar estado/ }));
  const estado = screen.getByLabelText('Nuevo Estado');
  fireEvent.change(estado, { target: { value: '3' } });
  fireEvent.change(estado, { target: { value: '4' } });
  expect(screen.queryByLabelText('Nuevo Estado')).toBeNull();
  expect(http.history.put).toHaveLength(0);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));

  const estadoRestaurado = screen.getByLabelText('Nuevo Estado');
  expect(estadoRestaurado).toHaveValue('3');
  expect(http.history.put).toHaveLength(0);
  fireEvent.change(estadoRestaurado, { target: { value: '4' } });
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar entrada' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(http.history.put.map((peticion) => peticion.url)).toEqual(['/tickets/12/registrar-entrada']);
});

test('el técnico debe guardar la reparación antes de confirmar la entrega', async () => {
  prepararTecnico(false);
  fireEvent.click(await screen.findByRole('button', { name: /Actualizar estado/ }));
  expect(screen.getByRole('option', { name: 'Entregado en ambiente' })).toBeDisabled();
  expect(http.history.put).toHaveLength(0);
});
