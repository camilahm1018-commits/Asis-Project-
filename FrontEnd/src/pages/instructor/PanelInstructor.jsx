// src/pages/instructor/PanelInstructor.jsx
// Ruta: /instructor  (rol: "instructor")
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsInstructor } from './navItems.js';
import { listarTicketsAdministrador, listarEquipos, obtenerUsuarioActual } from '../../services/adminService.js';

function PanelInstructor() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const usuario = obtenerUsuarioActual();

  useEffect(() => {
    async function cargar() {
      try {
        const [t, e] = await Promise.all([listarTicketsAdministrador(), listarEquipos()]);
        setTickets(t);
        setEquipos(e || []);
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
      <PanelLayout title="Mi Panel" rol="instructor" sidebarLabel="Instructor" navItems={navItemsInstructor}>
        {cargando && <p className="pa-loading">Cargando panel...</p>}
        {error && <p className="pa-error">{error}</p>}
      </PanelLayout>
    );
  }

  const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellidos}` : '';
  const misTickets = tickets.filter((t) => t.creadoPor === nombreCompleto);
  const pendientes = misTickets.filter((t) => !t.atendido).length;
  const resueltos = misTickets.filter((t) => t.atendido).length;
  // TODO backend: el modelo Usuario no tiene todavía una relación con un
  // ambiente para instructores (solo la tiene el cuentadante), así que
  // por ahora mostramos los equipos dañados de todos los ambientes.
  const equiposDañados = equipos.filter((e) => e.estado === 'dañado');

  return (
    <PanelLayout title="Mi Panel" rol="instructor" sidebarLabel="Instructor" navItems={navItemsInstructor}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <span className="pa-avatar pa-avatar--lg">{`${usuario?.nombre?.[0] ?? ''}${usuario?.apellidos?.[0] ?? ''}`.toUpperCase()}</span>
        <div>
          <h1 className="pa-section-header__title">Hola, {usuario?.nombre}</h1>
          <p className="pa-section-header__subtitle">
            Instructor · {new Date().toLocaleDateString('es-CO', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="pa-stat-grid">
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Mis Tickets</span>
          <span className="pa-stat-card__value">{misTickets.length}</span>
          <span className="pa-stat-card__sub">Total enviados</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Pendientes</span>
          <span className="pa-stat-card__value" style={{ color: '#facc15' }}>{pendientes}</span>
          <span className="pa-stat-card__sub">En proceso de atención</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Resueltos</span>
          <span className="pa-stat-card__value" style={{ color: '#4ade80' }}>{resueltos}</span>
          <span className="pa-stat-card__sub">Tickets cerrados</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Equipos Dañados</span>
          <span className="pa-stat-card__value" style={{ color: '#f87171' }}>{equiposDañados.length}</span>
          <span className="pa-stat-card__sub">En el sistema</span>
        </div>
      </div>

      <div className="pa-table-wrap">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(27,112,166,0.2)' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Mis Reportes Recientes</span>
        </div>
        {misTickets.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Aún no has enviado ningún reporte de falla</p>
          </div>
        ) : (
          <table className="pa-table">
            <thead><tr><th>ID</th><th>Título</th><th>Estado</th><th>Técnico</th><th>Fecha</th></tr></thead>
            <tbody>
              {misTickets.slice(0, 5).map((t) => (
                <tr key={t.id}>
                  <td className="pa-table-mono" style={{ color: '#45B3BF' }}>#{t.id}</td>
                  <td>{t.titulo}</td>
                  <td><span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span></td>
                  <td style={{ color: t.tecnico === 'Sin asignar' ? 'rgba(255,255,255,0.3)' : undefined }}>{t.tecnico}</td>
                  <td className="pa-table-mono">{t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PanelLayout>
  );
}

export default PanelInstructor;
