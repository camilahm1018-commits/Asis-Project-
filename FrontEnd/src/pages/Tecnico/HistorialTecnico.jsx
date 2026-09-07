// src/pages/tecnico/HistorialTecnico.jsx
// Ruta: /tecnico/historial
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsTecnico } from './navItems.js';
import { listarTicketsAdministrador, obtenerUsuarioActual } from '../../services/adminService.js';

function HistorialTecnico() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const usuario = obtenerUsuarioActual();

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

  const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellidos}` : '';
  const cerrados = tickets.filter((t) => t.tecnico === nombreCompleto && t.atendido);

  return (
    <PanelLayout title="Historial" rol="tecnico" sidebarLabel="Técnico" navItems={navItemsTecnico}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Historial</h1>
          <p className="pa-section-header__subtitle">Tickets que has resuelto</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando historial...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <>
          <div className="pa-stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="pa-stat-card">
              <span className="pa-stat-card__label">Total Resueltos</span>
              <span className="pa-stat-card__value" style={{ color: '#4ade80' }}>{cerrados.length}</span>
              <span className="pa-stat-card__sub">Por ti en total</span>
            </div>
            <div className="pa-stat-card">
              <span className="pa-stat-card__label">Total Asignados</span>
              <span className="pa-stat-card__value">{tickets.filter((t) => t.tecnico === nombreCompleto).length}</span>
              <span className="pa-stat-card__sub">Históricos</span>
            </div>
          </div>

          <div className="pa-table-wrap">
            <table className="pa-table">
              <thead><tr><th>ID</th><th>Título</th><th>Equipo</th><th>Ambiente</th><th>Fecha</th></tr></thead>
              <tbody>
                {cerrados.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(255,255,255,0.35)' }}>No hay tickets cerrados aún</td></tr>
                ) : cerrados.map((t) => (
                  <tr key={t.id}>
                    <td className="pa-table-mono" style={{ color: '#45B3BF' }}>#{t.id}</td>
                    <td>{t.titulo}</td>
                    <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{t.equipo}</td>
                    <td>{t.ambiente}</td>
                    <td className="pa-table-mono">{t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PanelLayout>
  );
}

export default HistorialTecnico;
