// src/pages/cuentadante/ReportesCuentadante.jsx
// Ruta: /cuentadante/reportes
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsCuentadante } from './navItems.js';
import { listarEquipos, listarAmbientes } from '../../services/adminService.js';

function ReportesCuentadante() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);

  useEffect(() => {
    async function cargar() {
      try {
        const [e, a] = await Promise.all([listarEquipos(), listarAmbientes()]);
        setEquipos(e || []);
        setAmbientes(a || []);
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
      <PanelLayout title="Reportes" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
        {cargando && <p className="pa-loading">Cargando reportes...</p>}
        {error && <p className="pa-error">{error}</p>}
      </PanelLayout>
    );
  }

  const total = equipos.length || 1;
  const activos = equipos.filter((e) => e.estado === 'activo').length;
  const dañados = equipos.filter((e) => e.estado === 'dañado').length;
  const mantenimiento = equipos.filter((e) => e.estado === 'mantenimiento').length;
  const baja = equipos.filter((e) => e.estado === 'baja').length;

  const filas = [
    { label: 'Activos', count: activos, color: '#4ade80' },
    { label: 'Dañados', count: dañados, color: '#ef4444' },
    { label: 'En Mantenimiento', count: mantenimiento, color: '#eab308' },
    { label: 'Dados de Baja', count: baja, color: '#6b7280' },
  ];

  return (
    <PanelLayout title="Reportes" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Reportes de Inventario</h1>
          <p className="pa-section-header__subtitle">Estado general de activos tecnológicos</p>
        </div>
      </div>

      <div className="pa-stat-grid">
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Total Inventario</span>
          <span className="pa-stat-card__value">{equipos.length}</span>
          <span className="pa-stat-card__sub">Equipos registrados</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Operativos</span>
          <span className="pa-stat-card__value" style={{ color: '#4ade80' }}>{Math.round((activos / total) * 100)}%</span>
          <span className="pa-stat-card__sub">{activos} equipos activos</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Dañados</span>
          <span className="pa-stat-card__value" style={{ color: '#f87171' }}>{dañados}</span>
          <span className="pa-stat-card__sub">Requieren reparación</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Ambientes</span>
          <span className="pa-stat-card__value" style={{ color: '#45B3BF' }}>{ambientes.length}</span>
          <span className="pa-stat-card__sub">{ambientes.filter((a) => a.estado === 'activo').length} activos</span>
        </div>
      </div>

      <div className="pa-grid-2">
        <div className="pa-card">
          <div className="pa-card__header">Estado del Inventario</div>
          <div className="pa-card__body">
            {filas.map((row) => (
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

        <div className="pa-card">
          <div className="pa-card__header">Distribución por Ambiente</div>
          <div className="pa-card__body">
            {ambientes.map((a) => {
              const count = equipos.filter((e) => e.id_ambiente === a.id_ambiente).length;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={a.id_ambiente} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre_a}</span>
                    <span className="pa-table-mono" style={{ fontSize: 13, marginLeft: 8, color: 'rgba(255,255,255,0.5)' }}>{count}</span>
                  </div>
                  <div className="pa-progress-track">
                    <div className="pa-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {ambientes.length === 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No hay ambientes registrados.</p>}
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}

export default ReportesCuentadante;
