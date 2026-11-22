// src/pages/PanelAdministrador.jsx
// Ruta: /administrador  (rol: "administrador")
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import AdminLayout from '../../components/AdminLayout.jsx';
import {
  listarUsuarios, listarEquipos, listarAmbientes, listarTicketsCrudos,
  listarRoles, obtenerTicketsPorMes,
} from '../../services/adminService.js';

const CHART_COLORS = ['#45B3BF', '#1B70A6', '#7EC8E3', '#facc15', '#a855f7', '#fb923c'];

const tooltipStyle = {
  background: '#02305F',
  border: '1px solid rgba(27,112,166,0.4)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
  padding: '8px 12px',
};

function PanelAdministrador() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [roles, setRoles] = useState([]);
  const [actividadMensual, setActividadMensual] = useState([]);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [u, e, a, t, r] = await Promise.all([
          listarUsuarios(), listarEquipos(), listarAmbientes(), listarTicketsCrudos(), listarRoles(),
        ]);
        setUsuarios(u || []);
        setEquipos(e || []);
        setAmbientes(a || []);
        setTickets(t || []);
        setRoles(r || []);

        // La actividad mensual viene de una vista SQL aparte; si aún
        // no existe en tu base de datos, seguimos mostrando el resto
        // del panel sin bloquear la carga.
        try {
          const actividad = await obtenerTicketsPorMes();
          setActividadMensual((actividad || []).map((row) => ({ mes: row.mes, tickets: row.total_tickets })));
        } catch {
          setActividadMensual([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <AdminLayout title="Dashboard">
        <p className="pa-loading">Cargando panel...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <p className="pa-error">{error}</p>
      </AdminLayout>
    );
  }

  const activosCount = equipos.filter((e) => e.estado === 'activo').length;
  const dañadosCount = equipos.filter((e) => e.estado === 'dañado').length;
  // "atendido" viene directo del modelo Tickets — no depende del nombre del estado.
  const ticketsAbiertos = tickets.filter((t) => !t.atendido).length;
  const usuariosActivos = usuarios.length;

  const mapaRoles = Object.fromEntries(roles.map((r) => [r.id_rol, r.nombre_rol]));
  const conteoPorRol = {};
  usuarios.forEach((u) => {
    const nombreRol = mapaRoles[u.id_rol] || 'Sin rol';
    conteoPorRol[nombreRol] = (conteoPorRol[nombreRol] || 0) + 1;
  });
  const rolData = Object.entries(conteoPorRol).map(([name, value]) => ({ name, value }));

  return (
    <AdminLayout title="Dashboard">
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Panel Administrativo</h1>
          <p className="pa-section-header__subtitle">Visión completa del sistema ASIS</p>
        </div>
      </div>

      <div className="pa-stat-grid">
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Usuarios Registrados</span>
          <span className="pa-stat-card__value" style={{ color: '#45B3BF' }}>{usuariosActivos}</span>
          <span className="pa-stat-card__sub">en el sistema</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Equipos Activos</span>
          <span className="pa-stat-card__value">{activosCount}</span>
          <span className="pa-stat-card__sub">de {equipos.length} inventariados</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Equipos Dañados</span>
          <span className="pa-stat-card__value" style={{ color: '#f87171' }}>{dañadosCount}</span>
          <span className="pa-stat-card__sub">Requieren atención</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Tickets Abiertos</span>
          <span className="pa-stat-card__value" style={{ color: '#facc15' }}>{ticketsAbiertos}</span>
          <span className="pa-stat-card__sub">Pendientes de resolución</span>
        </div>
      </div>

      <div className="pa-chart-grid">
        <div className="pa-chart-card">
          <div className="pa-chart-card__header">Usuarios por Rol</div>
          <div className="pa-chart-card__body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rolData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(27,112,166,0.1)' }} />
                <Bar dataKey="value" name="Usuarios" radius={[4, 4, 0, 0]}>
                  {rolData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pa-chart-card">
          <div className="pa-chart-card__header">Actividad Mensual (Tickets)</div>
          <div className="pa-chart-card__body">
            {actividadMensual.length === 0 ? (
              <div className="pa-empty-state">
                <span className="pa-empty-state__icon">📈</span>
                <p className="pa-empty-state__title">Sin datos de actividad todavía</p>
                <p className="pa-empty-state__subtitle">Se llenará cuando la vista vista_tickets_por_mes tenga registros</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={actividadMensual} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,112,166,0.15)" />
                  <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="tickets" name="Tickets" stroke="#45B3BF" strokeWidth={2} dot={{ fill: '#45B3BF', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="pa-card">
        <div className="pa-card__header">Estado de Ambientes</div>
        <div className="pa-card__body pa-ambiente-grid">
          {ambientes.map((a) => {
            const eqAmbiente = equipos.filter((e) => e.id_ambiente === a.id_ambiente);
            const dañados = eqAmbiente.filter((e) => e.estado === 'dañado').length;
            return (
              <div key={a.id_ambiente} className="pa-ambiente-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{a.nombre_a}</span>
                  <span className="pa-badge pa-badge--info">{a.estado}</span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{a.ubicacion}</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{eqAmbiente.length} equipos</span>
                  {dañados > 0 && <span style={{ fontSize: 12, color: '#f87171' }}>{dañados} dañados</span>}
                </div>
              </div>
            );
          })}
          {ambientes.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No hay ambientes registrados todavía.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default PanelAdministrador;
