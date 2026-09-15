// src/pages/TicketsAdministrador.jsx
// Ruta: /administrador/tickets
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import TicketDetailPanel from '../../components/TicketDetailPanel.jsx';
import { listarTicketsAdministrador } from '../../services/adminService.js';

function TicketsAdministrador() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        // listarTicketsAdministrador ya cruza tickets + equipos + usuarios
        // + ambientes + estados (ver adminService.js) para mostrar nombres
        // en vez de solo IDs.
        const data = await listarTicketsAdministrador();
        setTickets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const estadosDisponibles = ['Todos', ...new Set(tickets.map((t) => t.estado))];
  const filtered = filtro === 'Todos' ? tickets : tickets.filter((t) => t.estado === filtro);

  return (
    <AdminLayout title="Tickets">
      {seleccionado && <TicketDetailPanel ticket={seleccionado} onClose={() => setSeleccionado(null)} />}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Tickets</h1>
          <p className="pa-section-header__subtitle">Supervisión global de todos los tickets del sistema</p>
        </div>
      </div>

      <div className="pa-filter-row">
        {estadosDisponibles.map((f) => (
          <button
            key={f}
            className={`pa-filter-pill${filtro === f ? ' active' : ''}`}
            onClick={() => setFiltro(f)}
            type="button"
          >
            {f}
          </button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando tickets...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Motivo</th>
                <th>Ambiente</th>
                <th>Creado por</th>
                <th>Técnico</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => setSeleccionado(t)} style={{ cursor: 'pointer' }}>
                  <td className="pa-table-mono" style={{ color: '#45B3BF' }}>#{t.id}</td>
                  <td>{t.titulo}</td>
                  <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{t.ambiente}</td>
                  <td>{t.creadoPor}</td>
                  <td style={{ color: t.tecnico === 'Sin asignar' ? 'rgba(255,255,255,0.3)' : undefined }}>{t.tecnico}</td>
                  <td>
                    <span
                      className="pa-badge"
                      style={{
                        background: `${t.estadoColor}26`,
                        color: t.estadoColor,
                        borderColor: `${t.estadoColor}4d`,
                      }}
                    >
                      {t.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="pa-empty-state">
              <span className="pa-empty-state__icon">🎫</span>
              <p className="pa-empty-state__title">No hay tickets para este filtro</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default TicketsAdministrador;
