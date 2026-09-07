// src/pages/mesa-ayuda/TicketsMesaAyuda.jsx
// Ruta: /mesa-ayuda/tickets
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import TicketDetailPanel from '../../components/TicketDetailPanel.jsx';
import { navItemsMesaAyuda } from './navItems.js';
import { listarTicketsAdministrador } from '../../services/adminService.js';

function TicketsMesaAyuda() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        setTickets(await listarTicketsAdministrador());
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
    <PanelLayout title="Tickets" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
      {seleccionado && <TicketDetailPanel ticket={seleccionado} onClose={() => setSeleccionado(null)} />}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Tickets</h1>
          <p className="pa-section-header__subtitle">Listado de todos los tickets del sistema</p>
        </div>
      </div>

      <div className="pa-filter-row">
        {estadosDisponibles.map((f) => (
          <button key={f} className={`pa-filter-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)} type="button">{f}</button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando tickets...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr><th>ID</th><th>Título</th><th>Técnico</th><th>Estado</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => setSeleccionado(t)} style={{ cursor: 'pointer' }}>
                  <td className="pa-table-mono" style={{ color: '#45B3BF' }}>#{t.id}</td>
                  <td>{t.titulo}</td>
                  <td style={{ color: t.tecnico === 'Sin asignar' ? 'rgba(255,255,255,0.35)' : undefined }}>{t.tecnico}</td>
                  <td>
                    <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span>
                  </td>
                  <td className="pa-table-mono">{t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}</td>
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
    </PanelLayout>
  );
}

export default TicketsMesaAyuda;
