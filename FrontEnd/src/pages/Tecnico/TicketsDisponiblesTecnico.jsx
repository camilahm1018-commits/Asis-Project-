// src/pages/tecnico/TicketsDisponiblesTecnico.jsx
// Ruta: /tecnico/disponibles
//
// Acá el técnico ve los tickets que todavía no tienen técnico
// asignado y se los puede tomar él mismo. La asignación por Mesa de
// Ayuda sigue funcionando igual, esto es solo otra forma de llegar
// al mismo resultado (asignarTecnicoATicket), así que ambas conviven
// sin problema.
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import TicketDetailPanel from '../../components/TicketDetailPanel.jsx';
import { navItemsTecnico } from './navItems.js';
import {
  listarTicketsAdministrador, asignarTecnicoATicket, obtenerUsuarioActual,
} from '../../services/adminService.js';

function TicketsDisponiblesTecnico() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [tomando, setTomando] = useState(null);
  const [viendoDetalle, setViendoDetalle] = useState(null);
  const usuario = obtenerUsuarioActual();

  async function cargar() {
    try {
      setCargando(true);
      const t = await listarTicketsAdministrador();
      setTickets(t || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const disponibles = tickets.filter((t) => !t.idTecnico);

  async function handleTomar(ticket) {
    setTomando(ticket.id);
    try {
      await asignarTecnicoATicket(ticket.id, usuario?.id_usuario, usuario?.id_usuario);
      await cargar();
    } catch (err) {
      alert(err.message);
    } finally {
      setTomando(null);
    }
  }

  return (
    <PanelLayout title="Tickets Disponibles" rol="tecnico" sidebarLabel="Técnico" navItems={navItemsTecnico}>
      {viendoDetalle && <TicketDetailPanel ticket={viendoDetalle} onClose={() => setViendoDetalle(null)} />}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Tickets Disponibles</h1>
          <p className="pa-section-header__subtitle">Tickets sin técnico asignado — tómalos cuando quieras hacerte cargo</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando tickets disponibles...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {disponibles.map((t) => (
            <div
              key={t.id}
              className="pa-card"
              style={{ padding: 20, cursor: 'pointer' }}
              onClick={() => setViendoDetalle(t)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="pa-table-mono" style={{ fontSize: 12, fontWeight: 700, color: '#45B3BF' }}>#{t.id}</span>
                  <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>
                    {t.estado}
                  </span>
                  <span className="pa-badge pa-badge--neutral">Sin asignar</span>
                </div>
                <span className="pa-table-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: '#fff' }}>{t.titulo}</h3>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📍 {t.ambiente}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>💻 {t.equipo}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(27,112,166,0.15)', paddingTop: 12 }}>
                <button
                  type="button"
                  className="pa-btn-primary"
                  style={{ padding: '8px 16px', fontSize: 13, borderRadius: '8px' }}
                  disabled={tomando === t.id}
                  onClick={(e) => { e.stopPropagation(); handleTomar(t); }}
                >
                  {tomando === t.id ? 'Tomando...' : '✋ Tomar Ticket'}
                </button>
              </div>
            </div>
          ))}

          {disponibles.length === 0 && (
            <div className="pa-card" style={{ padding: 64, textAlign: 'center' }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🎉</span>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>No hay tickets disponibles por ahora.</p>
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
}

export default TicketsDisponiblesTecnico;
