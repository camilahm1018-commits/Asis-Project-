// src/pages/ReportesAdministrador.jsx
// Ruta: /administrador/reportes
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AdminLayout from '../../components/AdminLayout.jsx';
import {
  listarUsuarios, listarEquipos, listarAmbientes, listarTicketsCrudos, listarTecnicos,
  listarTicketsAdministrador,
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

function ReportesAdministrador() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [ticketsPorTecnico, setTicketsPorTecnico] = useState({});

  useEffect(() => {
    async function cargar() {
      try {
        const [u, e, a, t, tec, ticketsEnriquecidos] = await Promise.all([
          listarUsuarios(), listarEquipos(), listarAmbientes(), listarTicketsCrudos(),
          listarTecnicos(), listarTicketsAdministrador(),
        ]);
        setUsuarios(u || []);
        setEquipos(e || []);
        setAmbientes(a || []);
        setTickets(t || []);
        setTecnicos(tec || []);

        // Rendimiento por técnico: cuántos tickets tiene activos vs resueltos.
        // TODO backend: cuando exista un endpoint dedicado de rendimiento,
        // reemplaza este cálculo en el cliente por esa respuesta directa.
        const conteo = {};
        (ticketsEnriquecidos || []).forEach((tk) => {
          if (tk.tecnico === 'Sin asignar') return;
          if (!conteo[tk.tecnico]) conteo[tk.tecnico] = { activos: 0, resueltos: 0 };
          if (tk.atendido) conteo[tk.tecnico].resueltos += 1;
          else conteo[tk.tecnico].activos += 1;
        });
        setTicketsPorTecnico(conteo);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando) {
    return (
      <AdminLayout title="Reportes">
        <p className="pa-loading">Cargando reportes...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Reportes">
        <p className="pa-error">{error}</p>
      </AdminLayout>
    );
  }

  const equiposActivos = equipos.filter((e) => e.estado === 'activo').length;
  const ambientesActivos = ambientes.filter((a) => a.estado === 'activo').length;
  const ticketsAtendidos = tickets.filter((t) => t.atendido).length;

  const conteoPorTipo = {};
  equipos.forEach((e) => { conteoPorTipo[e.id_tipo] = (conteoPorTipo[e.id_tipo] || 0) + 1; });
  const tipoData = Object.entries(conteoPorTipo).map(([id, value]) => ({ name: `Tipo ${id}`, value }));

  return (
    <AdminLayout title="Reportes">
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Reportes del Sistema</h1>
          <p className="pa-section-header__subtitle">Estadísticas globales de ASIS</p>
        </div>
      </div>

      <div className="pa-stat-grid">
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Total Usuarios</span>
          <span className="pa-stat-card__value">{usuarios.length}</span>
          <span className="pa-stat-card__sub">registrados</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Total Equipos</span>
          <span className="pa-stat-card__value" style={{ color: '#45B3BF' }}>{equipos.length}</span>
          <span className="pa-stat-card__sub">{equiposActivos} operativos</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Total Ambientes</span>
          <span className="pa-stat-card__value">{ambientes.length}</span>
          <span className="pa-stat-card__sub">{ambientesActivos} activos</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Total Tickets</span>
          <span className="pa-stat-card__value" style={{ color: '#7EC8E3' }}>{tickets.length}</span>
          <span className="pa-stat-card__sub">{ticketsAtendidos} atendidos</span>
        </div>
      </div>

      <div className="pa-grid-2">
        <div className="pa-chart-card">
          <div className="pa-chart-card__header">Inventario por Tipo de Equipo</div>
          <div className="pa-chart-card__body">
            {/* TODO: reemplazar "Tipo N" por el nombre real cuando cruces
                con /tipo_equipo/tipos-equipo (igual que en EquiposAdministrador) */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tipoData} margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(27,112,166,0.1)' }} />
                <Bar dataKey="value" name="Equipos" radius={[4, 4, 0, 0]}>
                  {tipoData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pa-card">
          <div className="pa-card__header">Técnicos — Rendimiento</div>
          <div className="pa-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tecnicos.map((t) => {
              const nombreCompleto = `${t.nombre_u} ${t.apellidos_u}`;
              const datos = ticketsPorTecnico[nombreCompleto] || { activos: 0, resueltos: 0 };
              const total = datos.activos + datos.resueltos;
              const pct = total > 0 ? Math.round((datos.resueltos / total) * 100) : 0;
              return (
                <div key={t.id_usuario} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="pa-avatar pa-avatar--sm">{`${t.nombre_u[0]}${t.apellidos_u[0]}`.toUpperCase()}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{nombreCompleto}</span>
                      <span className="pa-table-mono" style={{ fontSize: 12, color: '#45B3BF' }}>{pct}%</span>
                    </div>
                    <div className="pa-progress-track">
                      <div className="pa-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {tecnicos.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No hay técnicos registrados.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ReportesAdministrador;
