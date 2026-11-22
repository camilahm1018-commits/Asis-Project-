import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsCuentadante } from './navItems.js';
import { listarMisAmbientes, listarEquipos, obtenerUsuarioActual } from '../../services/adminService.js';

function AmbientesCuentadante() {
  const [ambientes, setAmbientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const usuario = obtenerUsuarioActual();

  useEffect(() => {
    async function cargar() {
      try {
        // Cargar ambientes y equipos en paralelo
        const [ambientesData, equiposData] = await Promise.all([
          listarMisAmbientes(),
          listarEquipos()
        ]);
        
        setAmbientes(ambientesData || []);
        setEquipos(equiposData || []);
      } catch (err) {
        console.error('Error al cargar:', err);
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return (
    <PanelLayout title="Ambientes" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Ambientes</h1>
          <p className="pa-section-header__subtitle">Salas y laboratorios bajo tu responsabilidad</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando ambientes...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          
          {ambientes.map((a) => {
            // Filtrar equipos de este ambiente
            const eqAmbiente = equipos.filter((e) => e.id_ambiente === a.id_ambiente);
            const dañados = eqAmbiente.filter((e) => e.estado?.toLowerCase() === 'dañado').length;
            const mantenimiento = eqAmbiente.filter((e) => e.estado?.toLowerCase() === 'mantenimiento').length;
            const activos = eqAmbiente.filter((e) => e.estado?.toLowerCase() === 'activo').length;
            const pctSalud = eqAmbiente.length > 0 ? Math.round((activos / eqAmbiente.length) * 100) : 100;
            const colorSalud = pctSalud >= 80 ? '#4ade80' : pctSalud >= 50 ? '#facc15' : '#f87171';

            return (
              <div key={a.id_ambiente} className="pa-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{a.nombre_a}</p>
                    <p style={{ fontSize: 12, margin: '2px 0 0', color: 'rgba(255,255,255,0.45)' }}>{a.ubicacion}</p>
                  </div>
                  <span className="pa-badge pa-badge--info">{a.estado}</span>
                </div>
                {a.descripcion && <p style={{ fontSize: 12, marginBottom: 16, lineHeight: 1.5, color: 'rgba(255,255,255,0.5)' }}>{a.descripcion}</p>}

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Salud del ambiente</span>
                    <span className="pa-table-mono" style={{ fontSize: 12, color: colorSalud }}>{pctSalud}%</span>
                  </div>
                  <div className="pa-progress-track">
                    <div className="pa-progress-fill" style={{ width: `${pctSalud}%`, background: colorSalud }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Total', value: eqAmbiente.length, color: 'rgba(255,255,255,0.8)' },
                    { label: 'Activos', value: activos, color: '#4ade80' },
                    { label: 'Dañados', value: dañados, color: '#f87171' },
                    { label: 'Mantenim.', value: mantenimiento, color: '#facc15' },
                  ].map((stat) => (
                    <div key={stat.label} className="pa-ambiente-card__stat">
                      <p className="pa-ambiente-card__stat-value" style={{ fontSize: 15, color: stat.color }}>{stat.value}</p>
                      <p className="pa-ambiente-card__stat-label">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, marginTop: 12, color: 'rgba(255,255,255,0.35)' }}>Cap. máx: {a.capacidad_equipos ?? '—'} equipos</p>
              </div>
            );
          })}
          {ambientes.length === 0 && (
            <div className="pa-empty-state">
              <span className="pa-empty-state__icon">🏫</span>
              <p className="pa-empty-state__title">No tienes ambientes asignados</p>
              <p className="pa-empty-state__subtitle">Contacta al administrador para que te asigne ambientes.</p>
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
}

export default AmbientesCuentadante;