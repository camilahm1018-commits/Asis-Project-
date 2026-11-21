// src/pages/tecnico/PerfilTecnico.jsx
// Ruta: /tecnico/perfil
// La tarjeta del perfil (editable y centrada) es el componente compartido
// PerfilUsuario; acá solo se agregan las estadísticas propias del técnico.
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import PerfilUsuario from '../../components/PerfilUsuario.jsx';
import { navItemsTecnico } from './navItems.js';
import { listarTicketsAdministrador, obtenerUsuarioActual } from '../../services/adminService.js';

function PerfilTecnico() {
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const usuario = obtenerUsuarioActual();

  useEffect(() => {
    async function cargar() {
      try {
        setTickets(await listarTicketsAdministrador());
      } catch (err) {
        setError(err.message);
      }
    }
    cargar();
  }, []);

  const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellidos}` : '';
  const misTickets = tickets.filter((t) => t.tecnico === nombreCompleto);
  const resueltos = misTickets.filter((t) => t.atendido);

  return (
    <PanelLayout title="Mi Perfil" rol="tecnico" sidebarLabel="Técnico" navItems={navItemsTecnico}>
      <PerfilUsuario rolLabel="Técnico">
        {error && <p className="pa-error">{error}</p>}

        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      </PerfilUsuario>
    </PanelLayout>
  );
}

export default PerfilTecnico;
