// src/pages/cuentadante/PanelCuentadante.jsx
// Ruta: /cuentadante  (rol: "cuentadante")
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsCuentadante } from './navItems.js';
import {
  listarEquipos, listarAmbientes, listarTicketsAdministrador, listarTiposEquipo, obtenerUsuarioActual,
} from '../../services/adminService.js';

const CHART_COLORS = ['#45B3BF', '#1B70A6', '#7EC8E3', '#facc15', '#a855f7', '#fb923c'];
const tooltipStyle = { background: '#02305F', border: '1px solid rgba(27,112,166,0.4)', borderRadius: 8, color: '#fff', fontSize: 12, padding: '8px 12px' };

function PanelCuentadante() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const usuario = obtenerUsuarioActual();

  useEffect(() => {
    async function cargar() {
      try {
        const [e, a, t, te] = await Promise.all([listarEquipos(), listarAmbientes(), listarTicketsAdministrador(), listarTiposEquipo()]);
        const usuarioActual = obtenerUsuarioActual();
        
        // ✅ Filtrar solo los ambientes y equipos asignados a este cuentadante
        const misAmbientes = (a || []).filter((amb) => amb.id_cuentadante === usuarioActual?.id_usuario);
        const idsMisAmbientes = misAmbientes.map((amb) => amb.id_ambiente);
        
        setEquipos((e || []).filter((eq) => idsMisAmbientes.includes(eq.id_ambiente)));
        setAmbientes(misAmbientes);
        setTickets(t || []);
        setTiposEquipo(te || []);
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
      <PanelLayout title="Dashboard" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
        {cargando && <p className="pa-loading">Cargando inventario...</p>}
        {error && <p className="pa-error">{error}</p>}
      </PanelLayout>
    );
  }

  const activos = equipos.filter((e) => e.estado?.toLowerCase() === 'activo').length;
  const dañados = equipos.filter((e) => e.estado?.toLowerCase() === 'dañado');
  const mantenimiento = equipos.filter((e) => e.estado?.toLowerCase() === 'mantenimiento').length;

  const mapaTipos = Object.fromEntries(tiposEquipo.map((t) => [t.id_tipo, t.nombre_t]));
  const porTipoMap = {};
  equipos.forEach((e) => { 
    const nombreTipo = mapaTipos[e.id_tipo] || `Tipo ${e.id_tipo}`; 
    porTipoMap[nombreTipo] = (porTipoMap[nombreTipo] || 0) + 1; 
  });
  const tipoData = Object.entries(porTipoMap).map(([name, value]) => ({ name, value }));

  const porAmbienteData = ambientes.map((a) => ({
    name: a.nombre_a,
    activos: equipos.filter((e) => e.id_ambiente === a.id_ambiente && e.estado?.toLowerCase() === 'activo').length,
    dañados: equipos.filter((e) => e.id_ambiente === a.id_ambiente && e.estado?.toLowerCase() === 'dañado').length,
    mantenimiento: equipos.filter((e) => e.id_ambiente === a.id_ambiente && e.estado?.toLowerCase() === 'mantenimiento').length,
  }));

  const mapaAmbientes = Object.fromEntries(ambientes.map((a) => [a.id_ambiente, a.nombre_a]));

  return (
    <PanelLayout title="Dashboard" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <span className="pa-avatar pa-avatar--lg">{`${usuario?.nombre?.[0] ?? ''}${usuario?.apellidos?.[0] ?? ''}`.toUpperCase()}</span>
        <div>
          <h1 className="pa-section-header__title">Mi Inventario</h1>
          <p className="pa-section-header__subtitle">Cuentadante: {usuario?.nombre} {usuario?.apellidos}</p>
        </div>
      </div>

      <div className="pa-stat-grid">
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Total Equipos</span>
          <span className="pa-stat-card__value">{equipos.length}</span>
          <span className="pa-stat-card__sub">Bajo tu responsabilidad</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Operativos</span>
          <span className="pa-stat-card__value" style={{ color: '#4ade80' }}>{activos}</span>
          <span className="pa-stat-card__sub">En buen estado</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Dañados</span>
          <span className="pa-stat-card__value" style={{ color: '#f87171' }}>{dañados.length}</span>
          <span className="pa-stat-card__sub">Requieren atención</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">En Mantenimiento</span>
          <span className="pa-stat-card__value" style={{ color: '#facc15' }}>{mantenimiento}</span>
          <span className="pa-stat-card__sub">En proceso de reparación</span>
        </div>
      </div>

      <div className="pa-chart-grid">
        <div className="pa-chart-card">
          <div className="pa-chart-card__header">Inventario por Tipo de Equipo</div>
          <div className="pa-chart-card__body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tipoData} margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(27,112,166,0.1)' }} formatter={(v) => [v, 'Equipos']} />
                <Bar dataKey="value" name="Equipos" radius={[4, 4, 0, 0]}>
                  {tipoData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="pa-chart-card">
          <div className="pa-chart-card__header">Equipos por Ambiente</div>
          <div className="pa-chart-card__body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porAmbienteData} margin={{ top: 4, right: 8, left: -20, bottom: 24 }}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(27,112,166,0.1)' }} />
                <Bar dataKey="activos" name="Activos" stackId="a" fill="#45B3BF" />
                <Bar dataKey="dañados" name="Dañados" stackId="a" fill="#ef4444" />
                <Bar dataKey="mantenimiento" name="Mantenim." stackId="a" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="pa-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
        <div className="pa-card__header" style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171', background: 'rgba(239,68,68,0.06)' }}>
          <span>⚠ Equipos Dañados — Requieren Acción</span>
          <span className="pa-table-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{dañados.length} equipos</span>
        </div>
        <table className="pa-table">
          <thead><tr><th>Código</th><th>Equipo</th><th>Ambiente</th><th>Tickets Activos</th></tr></thead>
          <tbody>
            {dañados.map((e) => {
              // ✅ CORREGIDO: Filtrar por id_equipo en lugar de por nombre
              const tkActivos = tickets.filter((t) => t.id_equipo === e.id_equipo && !t.atendido);
              return (
                <tr key={e.id_equipo}>
                  <td className="pa-table-mono" style={{ color: '#f87171' }}>{e.codigo}</td>
                  <td>
                    <div>{e.nombre}</div>
                    <div className="pa-table-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>S/N {e.serial || '—'}</div>
                  </td>
                  <td>{mapaAmbientes[e.id_ambiente] || '—'}</td>
                  <td>
                    {tkActivos.length > 0
                      ? <span className="pa-table-mono" style={{ fontSize: 12, color: '#45B3BF' }}>{tkActivos.map((t) => `#${t.id}`).join(', ')}</span>
                      : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Sin ticket</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {dañados.length === 0 && (
          <div className="pa-empty-state">
            <span className="pa-empty-state__icon">✅</span>
            <p className="pa-empty-state__title">No hay equipos dañados por ahora</p>
          </div>
        )}
      </div>
    </PanelLayout>
  );
}

export default PanelCuentadante;