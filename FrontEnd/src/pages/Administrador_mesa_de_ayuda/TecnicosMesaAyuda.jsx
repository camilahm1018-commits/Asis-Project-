// src/pages/mesa-ayuda/TecnicosMesaAyuda.jsx
// Ruta: /mesa-ayuda/tecnicos
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsMesaAyuda } from './navItems.js';
import { listarTecnicos, listarTicketsAdministrador } from '../../services/adminService.js';

function TecnicosMesaAyuda() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tecnicos, setTecnicos] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    async function cargar() {
      try {
        const [tec, t] = await Promise.all([listarTecnicos(), listarTicketsAdministrador()]);
        setTecnicos(tec || []);
        setTickets(t);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  // TODO backend: el modelo Usuario no tiene un campo de "disponibilidad"
  // (Disponible / Ocupado / Inactivo) como en el diseño de Figma; aquí lo
  // calculamos solo a partir de la carga de tickets activos.
  function estadoPorCarga(activos) {
    if (activos === 0) return { label: 'Disponible', className: 'pa-badge--success' };
    if (activos <= 3) return { label: 'Ocupado', className: 'pa-badge--warning' };
    return { label: 'Sobrecargado', className: 'pa-badge--danger' };
  }

  return (
    <PanelLayout title="Técnicos" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Técnicos</h1>
          <p className="pa-section-header__subtitle">Estado y carga de trabajo del equipo técnico</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando técnicos...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <>
          <div className="pa-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="pa-stat-card">
              <span className="pa-stat-card__label">Total Técnicos</span>
              <span className="pa-stat-card__value">{tecnicos.length}</span>
            </div>
            <div className="pa-stat-card">
              <span className="pa-stat-card__label">Tickets Activos</span>
              <span className="pa-stat-card__value" style={{ color: '#facc15' }}>{tickets.filter((t) => !t.atendido).length}</span>
            </div>
            <div className="pa-stat-card">
              <span className="pa-stat-card__label">Tickets Resueltos</span>
              <span className="pa-stat-card__value" style={{ color: '#4ade80' }}>{tickets.filter((t) => t.atendido).length}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {tecnicos.map((tec) => {
              const nombreCompleto = `${tec.nombre_u} ${tec.apellidos_u}`;
              const tkTecnico = tickets.filter((t) => t.tecnico === nombreCompleto);
              const activos = tkTecnico.filter((t) => !t.atendido).length;
              const resueltos = tkTecnico.filter((t) => t.atendido).length;
              const estado = estadoPorCarga(activos);
              return (
                <div key={tec.id_usuario} className="pa-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <span className="pa-avatar pa-avatar--lg">{`${tec.nombre_u[0]}${tec.apellidos_u[0]}`.toUpperCase()}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{nombreCompleto}</p>
                      <p style={{ fontSize: 12, margin: '2px 0 0', color: 'rgba(255,255,255,0.5)' }}>{tec.correo_u}</p>
                    </div>
                    <span className={`pa-badge ${estado.className}`}>{estado.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div className="pa-ambiente-card__stat">
                      <p className="pa-ambiente-card__stat-value" style={{ color: '#45B3BF' }}>{activos}</p>
                      <p className="pa-ambiente-card__stat-label">Activos</p>
                    </div>
                    <div className="pa-ambiente-card__stat">
                      <p className="pa-ambiente-card__stat-value" style={{ color: '#7EC8E3' }}>{resueltos}</p>
                      <p className="pa-ambiente-card__stat-label">Resueltos</p>
                    </div>
                  </div>
                  {tkTecnico.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 500, marginBottom: 8, color: 'rgba(255,255,255,0.4)' }}>Tickets asignados</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {tkTecnico.slice(0, 3).map((tk) => (
                          <div key={tk.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="pa-table-mono" style={{ fontSize: 11, color: '#45B3BF' }}>#{tk.id}</span>
                            <span style={{ fontSize: 11, margin: '0 8px', flex: 1, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.titulo}</span>
                            <span className="pa-badge" style={{ background: `${tk.estadoColor}26`, color: tk.estadoColor, borderColor: `${tk.estadoColor}4d`, flexShrink: 0 }}>{tk.estado}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {tecnicos.length === 0 && (
              <div className="pa-empty-state">
                <span className="pa-empty-state__icon">🔧</span>
                <p className="pa-empty-state__title">No hay técnicos registrados</p>
              </div>
            )}
          </div>
        </>
      )}
    </PanelLayout>
  );
}

export default TecnicosMesaAyuda;
