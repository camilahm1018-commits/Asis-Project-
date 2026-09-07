// src/pages/tecnico/PanelTecnico.jsx
// Ruta: /tecnico  (rol: "tecnico")
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsTecnico } from './navItems.js';
import { listarTicketsAdministrador, obtenerUsuarioActual } from '../../services/adminService.js';

function PanelTecnico() {
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

  if (cargando || error) {
    return (
      <PanelLayout title="Mi Panel" rol="tecnico" sidebarLabel="Técnico" navItems={navItemsTecnico}>
        {cargando && <p className="pa-loading">Cargando panel...</p>}
        {error && <p className="pa-error">{error}</p>}
      </PanelLayout>
    );
  }

  const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellidos}` : '';
  const misTickets = tickets.filter((t) => t.tecnico === nombreCompleto);
  const activos = misTickets.filter((t) => !t.atendido);
  const resueltos = misTickets.filter((t) => t.atendido);

  return (
    <PanelLayout title="Mi Panel" rol="tecnico" sidebarLabel="Técnico" navItems={navItemsTecnico}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <span className="pa-avatar pa-avatar--lg">{`${usuario?.nombre?.[0] ?? ''}${usuario?.apellidos?.[0] ?? ''}`.toUpperCase()}</span>
        <div>
          <h1 className="pa-section-header__title">Hola, {usuario?.nombre}</h1>
          <p className="pa-section-header__subtitle">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="pa-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Tickets Asignados</span>
          <span className="pa-stat-card__value">{misTickets.length}</span>
          <span className="pa-stat-card__sub">Total a mí asignados</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Activos</span>
          <span className="pa-stat-card__value" style={{ color: '#facc15' }}>{activos.length}</span>
          <span className="pa-stat-card__sub">Actualmente trabajando</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Resueltos</span>
          <span className="pa-stat-card__value" style={{ color: '#4ade80' }}>{resueltos.length}</span>
          <span className="pa-stat-card__sub">Tickets cerrados</span>
        </div>
      </div>

      <div className="pa-table-wrap">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(27,112,166,0.2)' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Tickets Activos</span>
        </div>
        <table className="pa-table">
          <thead>
            <tr><th>ID</th><th>Título</th><th>Equipo</th><th>Ambiente</th><th>Estado</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {activos.map((t) => (
              <tr key={t.id}>
                <td className="pa-table-mono" style={{ color: '#45B3BF' }}>#{t.id}</td>
                <td>{t.titulo}</td>
                <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{t.equipo}</td>
                <td>{t.ambiente}</td>
                <td><span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span></td>
                <td className="pa-table-mono">{t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {activos.length === 0 && (
          <div className="pa-empty-state">
            <span className="pa-empty-state__icon">🎉</span>
            <p className="pa-empty-state__title">No tienes tickets activos por ahora</p>
          </div>
        )}
      </div>
    </PanelLayout>
  );
}

export default PanelTecnico;
