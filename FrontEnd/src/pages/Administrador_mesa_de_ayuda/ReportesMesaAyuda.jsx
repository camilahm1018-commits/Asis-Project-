// src/pages/mesa-ayuda/ReportesMesaAyuda.jsx
// Ruta: /mesa-ayuda/reportes
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsMesaAyuda } from './navItems.js';
import { listarTicketsAdministrador, listarTecnicos } from '../../services/adminService.js';

function ReportesMesaAyuda() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  useEffect(() => {
    async function cargar() {
      try {
        const [t, tec] = await Promise.all([listarTicketsAdministrador(), listarTecnicos()]);
        setTickets(t);
        setTecnicos(tec || []);
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
      <PanelLayout title="Reportes" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
        {cargando && <p className="pa-loading">Cargando reportes...</p>}
        {error && <p className="pa-error">{error}</p>}
      </PanelLayout>
    );
  }

  const total = tickets.length || 1;
  const estadoMap = {};
  tickets.forEach((t) => { estadoMap[t.estado] = estadoMap[t.estado] || { count: 0, color: t.estadoColor }; estadoMap[t.estado].count += 1; });
  const distribucionEstado = Object.entries(estadoMap).map(([label, v]) => ({ label, ...v }));

  return (
    <PanelLayout title="Reportes" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Generar Reportes</h1>
          <p className="pa-section-header__subtitle">Estadísticas y análisis del sistema de soporte</p>
        </div>
      </div>

      <div className="pa-stat-grid">
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Total Tickets</span>
          <span className="pa-stat-card__value">{tickets.length}</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Resueltos</span>
          <span className="pa-stat-card__value" style={{ color: '#4ade80' }}>{tickets.filter((t) => t.atendido).length}</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Sin Asignar</span>
          <span className="pa-stat-card__value" style={{ color: '#f87171' }}>{tickets.filter((t) => t.tecnico === 'Sin asignar').length}</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Tasa de Atención</span>
          <span className="pa-stat-card__value" style={{ color: '#45B3BF' }}>{Math.round((tickets.filter((t) => t.atendido).length / total) * 100)}%</span>
        </div>
      </div>

      <div className="pa-grid-2">
        <div className="pa-card">
          <div className="pa-card__header">Distribución por Estado</div>
          <div className="pa-card__body">
            {distribucionEstado.map((row) => (
              <div key={row.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{row.label}</span>
                  <span className="pa-table-mono" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{row.count} ({Math.round((row.count / total) * 100)}%)</span>
                </div>
                <div className="pa-progress-track">
                  <div className="pa-progress-fill" style={{ width: `${Math.round((row.count / total) * 100)}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pa-card pa-chart-card--span2">
          <div className="pa-card__header">Tickets por Técnico</div>
          <div className="pa-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {tecnicos.map((tec) => {
              const nombreCompleto = `${tec.nombre_u} ${tec.apellidos_u}`;
              const totalTecnico = tickets.filter((t) => t.tecnico === nombreCompleto).length;
              return (
                <div key={tec.id_usuario} className="pa-ambiente-card__stat" style={{ padding: 16 }}>
                  <span className="pa-avatar pa-avatar--lg" style={{ margin: '0 auto 8px', display: 'flex' }}>
                    {`${tec.nombre_u[0]}${tec.apellidos_u[0]}`.toUpperCase()}
                  </span>
                  <p style={{ fontSize: 12, fontWeight: 500, margin: '0 0 4px', color: 'rgba(255,255,255,0.8)' }}>{tec.nombre_u}</p>
                  <p className="pa-ambiente-card__stat-value" style={{ color: '#45B3BF' }}>{totalTecnico}</p>
                  <p className="pa-ambiente-card__stat-label">total</p>
                </div>
              );
            })}
            {tecnicos.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No hay técnicos registrados.</p>}
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}

export default ReportesMesaAyuda;
