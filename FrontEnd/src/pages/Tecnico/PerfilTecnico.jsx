// src/pages/tecnico/PerfilTecnico.jsx
// Ruta: /tecnico/perfil
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsTecnico } from './navItems.js';
import { listarTicketsAdministrador, obtenerUsuarioActual } from '../../services/adminService.js';

function PerfilTecnico() {
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
  const misTickets = tickets.filter((t) => t.tecnico === nombreCompleto);
  const resueltos = misTickets.filter((t) => t.atendido);
  const iniciales = `${usuario?.nombre?.[0] ?? ''}${usuario?.apellidos?.[0] ?? ''}`.toUpperCase();

  return (
    <PanelLayout title="Mi Perfil" rol="tecnico" sidebarLabel="Técnico" navItems={navItemsTecnico}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Mi Perfil</h1>
          <p className="pa-section-header__subtitle">Información de tu cuenta y estadísticas</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando perfil...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-grid-2" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <div className="pa-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg, #1B70A6, #45B3BF)', color: '#fff',
            }}>
              {iniciales}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 600, fontSize: 16, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{nombreCompleto}</p>
              <p style={{ fontSize: 13, color: '#45B3BF', margin: '2px 0 0' }}>Técnico</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{usuario?.correo}</p>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(2,40,89,0.6)' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Rol</span>
                <span style={{ fontSize: 12, color: '#45B3BF' }}>Técnico</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(2,40,89,0.6)' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Correo</span>
                <span className="pa-table-mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{usuario?.correo}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="pa-card">
              <div className="pa-card__header">Estadísticas de Rendimiento</div>
              <div className="pa-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div className="pa-ambiente-card__stat" style={{ padding: 16 }}>
                  <p className="pa-ambiente-card__stat-value" style={{ fontSize: 22, color: '#45B3BF' }}>{misTickets.length}</p>
                  <p className="pa-ambiente-card__stat-label">Asignados</p>
                </div>
                <div className="pa-ambiente-card__stat" style={{ padding: 16 }}>
                  <p className="pa-ambiente-card__stat-value" style={{ fontSize: 22, color: '#4ade80' }}>{resueltos.length}</p>
                  <p className="pa-ambiente-card__stat-label">Resueltos</p>
                </div>
              </div>
            </div>
            <div className="pa-card">
              <div className="pa-card__header">Tickets Recientes</div>
              <div className="pa-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {misTickets.slice(0, 4).map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="pa-table-mono" style={{ fontSize: 11, color: '#45B3BF' }}>#{t.id}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{t.titulo}</span>
                    </div>
                    <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span>
                  </div>
                ))}
                {misTickets.length === 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Todavía no tienes tickets asignados.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}

export default PerfilTecnico;
