// src/pages/cuentadante/ReportesCuentadante.jsx
// Ruta: /cuentadante/reportes
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsCuentadante } from './navItems.js';
import { listarEquipos, listarAmbientes, obtenerUsuarioActual } from '../../services/adminService.js';

function ReportesCuentadante() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);

  useEffect(() => {
    async function cargar() {
      try {
        const [e, a] = await Promise.all([listarEquipos(), listarAmbientes()]);
        const usuarioActual = obtenerUsuarioActual();
        
        // ✅ Filtrar solo los ambientes y equipos asignados a este cuentadante
        const misAmbientes = (a || []).filter((amb) => amb.id_cuentadante === usuarioActual?.id_usuario);
        const idsMisAmbientes = misAmbientes.map((amb) => amb.id_ambiente);
        
        setEquipos((e || []).filter((eq) => idsMisAmbientes.includes(eq.id_ambiente)));
        setAmbientes(misAmbientes);
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

  // ✅ CORREGIDO: Uso de toLowerCase() para evitar errores por mayúsculas/minúsculas
  const activos = equipos.filter((e) => e.estado?.toLowerCase() === 'activo').length;
  const dañados = equipos.filter((e) => e.estado?.toLowerCase() === 'dañado').length;
  const mantenimiento = equipos.filter((e) => e.estado?.toLowerCase() === 'mantenimiento').length;
  const baja = equipos.filter((e) => e.estado?.toLowerCase() === 'baja').length;
  const totalEquipos = equipos.length;

  const filas = [
    { label: 'Activos', count: activos, color: '#4ade80' },
    { label: 'Dañados', count: dañados, color: '#ef4444' },
    { label: 'En Mantenimiento', count: mantenimiento, color: '#eab308' },
    { label: 'Dados de Baja', count: baja, color: '#6b7280' },
  ];

  // Función segura para calcular porcentajes
  const calcularPorcentaje = (valor) => {
    if (totalEquipos === 0) return 0;
    return Math.round((valor / totalEquipos) * 100);
  };

  return (
    <PanelLayout title="Reportes" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Reportes de Inventario</h1>
          <p className="pa-section-header__subtitle">Estado general de tus activos tecnológicos asignados</p>
        </div>
      </div>

      <div className="pa-stat-grid">
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Total Inventario</span>
          <span className="pa-stat-card__value">{totalEquipos}</span>
          <span className="pa-stat-card__sub">Equipos bajo tu responsabilidad</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Operativos</span>
          <span className="pa-stat-card__value" style={{ color: '#4ade80' }}>{calcularPorcentaje(activos)}%</span>
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
          <span className="pa-stat-card__sub">
            {ambientes.filter((a) => a.estado?.toLowerCase() === 'activo').length} activos
          </span>
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
                  <span className="pa-table-mono" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    {row.count} ({calcularPorcentaje(row.count)}%)
                  </span>
                </div>
                <div className="pa-progress-track">
                  <div className="pa-progress-fill" style={{ width: `${calcularPorcentaje(row.count)}%`, background: row.color }} />
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
              const pct = calcularPorcentaje(count);
              return (
                <div key={a.id_ambiente} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.nombre_a}
                    </span>
                    <span className="pa-table-mono" style={{ fontSize: 13, marginLeft: 8, color: 'rgba(255,255,255,0.5)' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="pa-progress-track">
                    <div className="pa-progress-fill" style={{ width: `${pct}%`, background: '#45B3BF' }} />
                  </div>
                </div>
              );
            })}
            {ambientes.length === 0 && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px 0' }}>
                No tienes ambientes asignados.
              </p>
            )}
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}

export default ReportesCuentadante;