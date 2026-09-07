// src/pages/instructor/MisTicketsInstructor.jsx
// Ruta: /instructor/mis-reportes
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsInstructor } from './navItems.js';
import { listarTicketsAdministrador, obtenerUsuarioActual } from '../../services/adminService.js';

function MisTicketsInstructor() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
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
  const misTickets = tickets.filter((t) => t.creadoPor === nombreCompleto);
  const estadosDisponibles = ['Todos', ...new Set(misTickets.map((t) => t.estado))];
  const filtered = filtro === 'Todos' ? misTickets : misTickets.filter((t) => t.estado === filtro);

  return (
    <PanelLayout title="Mis Reportes" rol="instructor" sidebarLabel="Instructor" navItems={navItemsInstructor}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Mis Reportes</h1>
          <p className="pa-section-header__subtitle">Fallas que has reportado al sistema</p>
        </div>
      </div>

      <div className="pa-filter-row">
        {estadosDisponibles.map((f) => (
          <button key={f} className={`pa-filter-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)} type="button">{f}</button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando tus reportes...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        filtered.length === 0 ? (
          <div className="pa-card" style={{ padding: 64, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No hay reportes en esta categoría</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((t) => (
              <div key={t.id} className="pa-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="pa-table-mono" style={{ fontSize: 12, fontWeight: 700, color: '#45B3BF' }}>#{t.id}</span>
                    <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span>
                  </div>
                  <span className="pa-table-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px', color: '#fff' }}>{t.titulo}</h3>
                <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid rgba(27,112,166,0.15)' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>💻 {t.equipo}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    Técnico: <span style={{ color: t.tecnico === 'Sin asignar' ? '#f87171' : '#45B3BF' }}>{t.tecnico}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </PanelLayout>
  );
}

export default MisTicketsInstructor;
