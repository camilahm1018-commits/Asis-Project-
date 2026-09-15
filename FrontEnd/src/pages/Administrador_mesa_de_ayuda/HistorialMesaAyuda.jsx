// src/pages/mesa-ayuda/HistorialMesaAyuda.jsx
// Ruta: /mesa-ayuda/historial
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import TicketDetailPanel from '../../components/TicketDetailPanel.jsx';
import { navItemsMesaAyuda } from './navItems.js';
import { listarTicketsAdministrador } from '../../services/adminService.js';

function HistorialMesaAyuda() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await listarTicketsAdministrador();
        setTickets(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  // Filtrar solo los tickets que ya fueron atendidos/cerrados
  const cerrados = tickets.filter((t) => t.atendido);

  return (
    <PanelLayout title="Historial" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
      
      {/* Modal de detalle reutilizable */}
      {seleccionado && (
        <TicketDetailPanel ticket={seleccionado} onClose={() => setSeleccionado(null)} />
      )}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Historial de Tickets</h1>
          <p className="pa-section-header__subtitle">Tickets resueltos y cerrados</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando historial...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <>
          {/* Estadísticas rápidas */}
          <div className="pa-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
            <div className="pa-stat-card">
              <span className="pa-stat-card__label">Total Cerrados</span>
              <span className="pa-stat-card__value">{cerrados.length}</span>
              <span className="pa-stat-card__sub">Historial completo</span>
            </div>
            <div className="pa-stat-card">
              <span className="pa-stat-card__label">Tasa de Atención</span>
              <span className="pa-stat-card__value" style={{ color: '#45B3BF' }}>
                {tickets.length > 0 ? Math.round((cerrados.length / tickets.length) * 100) : 0}%
              </span>
              <span className="pa-stat-card__sub">Sobre el total de tickets</span>
            </div>
            <div className="pa-stat-card">
              <span className="pa-stat-card__label">Total en Sistema</span>
              <span className="pa-stat-card__value" style={{ color: '#7EC8E3' }}>{tickets.length}</span>
              <span className="pa-stat-card__sub">Todos los tickets</span>
            </div>
          </div>

          {/* Tabla de tickets cerrados */}
          <div className="pa-table-wrap">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(27,112,166,0.2)' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Tickets Cerrados</span>
              <span style={{ fontSize: 12, marginLeft: 8, color: 'rgba(255,255,255,0.35)' }}>— clic para ver detalle</span>
            </div>
            <table className="pa-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Motivo</th>
                  <th>Equipo</th>
                  <th>Técnico</th>
                  <th>Fecha Cierre</th>
                </tr>
              </thead>
              <tbody>
                {cerrados.map((t) => (
                  <tr 
                    key={t.id} 
                    onClick={() => setSeleccionado(t)} 
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="pa-table-mono" style={{ color: '#45B3BF' }}>#{t.id}</td>
                    <td>{t.motivo || t.titulo}</td>
                    <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{t.equipo}</td>
                    <td>{t.tecnico}</td>
                    <td className="pa-table-mono">
                      {t.fecha_retorno || t.fecha ? new Date(t.fecha_retorno || t.fecha).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {cerrados.length === 0 && (
              <div className="pa-empty-state">
                <span className="pa-empty-state__icon">📋</span>
                <p className="pa-empty-state__title">Aún no hay tickets cerrados</p>
              </div>
            )}
          </div>
        </>
      )}
    </PanelLayout>
  );
}

export default HistorialMesaAyuda;