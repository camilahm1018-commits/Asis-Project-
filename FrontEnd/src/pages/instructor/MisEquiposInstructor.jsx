// src/pages/instructor/MisEquiposInstructor.jsx
// Ruta: /instructor/equipos
//
// TODO backend: en el diseño de Figma esta vista se filtraba por el
// ambiente asignado al instructor, pero el modelo Usuario todavía no
// tiene esa relación (solo el cuentadante está vinculado a un
// ambiente). Por ahora se muestran todos los equipos del sistema.
// Cuando exista esa relación, agrega un filtro por
// equipo.id_ambiente === usuario.id_ambiente aquí mismo.
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsInstructor } from './navItems.js';
import { listarEquipos, listarTicketsAdministrador, listarAmbientes } from '../../services/adminService.js';

const badgeColorPorEstado = {
  activo: 'pa-badge--success',
  dañado: 'pa-badge--danger',
  mantenimiento: 'pa-badge--warning',
  baja: 'pa-badge--neutral',
};

function MisEquiposInstructor() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ambientes, setAmbientes] = useState([]);

  useEffect(() => {
    async function cargar() {
      try {
        const [e, t, a] = await Promise.all([listarEquipos(), listarTicketsAdministrador(), listarAmbientes()]);
        setEquipos(e || []);
        setTickets(t);
        setAmbientes(a || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const mapaAmbientes = Object.fromEntries(ambientes.map((a) => [a.id_ambiente, a.nombre_a]));

  return (
    <PanelLayout title="Equipos" rol="instructor" sidebarLabel="Instructor" navItems={navItemsInstructor}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Equipos</h1>
          <p className="pa-section-header__subtitle">Inventario de activos tecnológicos disponibles para reportar</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando equipos...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {equipos.map((e) => {
            const ticketsEquipo = tickets.filter((t) => t.equipo === e.nombre && !t.atendido);
            return (
              <div key={e.id_equipo} className="pa-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{e.nombre}</p>
                    <p className="pa-table-mono" style={{ fontSize: 11, margin: '2px 0 0', color: 'rgba(255,255,255,0.4)' }}>{e.codigo}</p>
                  </div>
                  <span className={`pa-badge ${badgeColorPorEstado[e.estado] || 'pa-badge--neutral'}`}>{e.estado}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Ambiente</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{mapaAmbientes[e.id_ambiente] || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Marca</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{e.marca || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Serial</span>
                    <span className="pa-table-mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{e.serial || '—'}</span>
                  </div>
                </div>
                {ticketsEquipo.length > 0 && (
                  <div style={{ paddingTop: 12, borderTop: '1px solid rgba(27,112,166,0.15)' }}>
                    <p style={{ fontSize: 11, marginBottom: 6, color: 'rgba(255,255,255,0.4)' }}>Tickets activos</p>
                    {ticketsEquipo.map((t) => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="pa-table-mono" style={{ fontSize: 11, color: '#45B3BF' }}>#{t.id}</span>
                        <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {equipos.length === 0 && (
            <div className="pa-empty-state">
              <span className="pa-empty-state__icon">💻</span>
              <p className="pa-empty-state__title">No hay equipos registrados</p>
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
}

export default MisEquiposInstructor;
