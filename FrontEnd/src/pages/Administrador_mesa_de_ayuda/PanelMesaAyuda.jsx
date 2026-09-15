
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsMesaAyuda } from './navItems.js';
import { listarTicketsAdministrador, listarTecnicos } from '../../services/adminService.js';

const CHART_COLORS = ['#45B3BF', '#1B70A6', '#7EC8E3', '#facc15', '#a855f7', '#fb923c'];
const tooltipStyle = { background: '#02305F', border: '1px solid rgba(27,112,166,0.4)', borderRadius: 8, color: '#fff', fontSize: 12, padding: '8px 12px' };

function PanelMesaAyuda() {
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
      <PanelLayout title="Dashboard" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
        {cargando && <p className="pa-loading">Cargando panel...</p>}
        {error && <p className="pa-error">{error}</p>}
      </PanelLayout>
    );
  }

  const abiertos = tickets.filter((t) => !t.atendido).length;
  const cerrados = tickets.filter((t) => t.atendido).length;
  const sinAsignar = tickets.filter((t) => t.tecnico === 'Sin asignar').length;

  const estadoMap = {};
  tickets.forEach((t) => { estadoMap[t.estado] = estadoMap[t.estado] || { value: 0, color: t.estadoColor }; estadoMap[t.estado].value += 1; });
  const estadoData = Object.entries(estadoMap).map(([name, v]) => ({ name, value: v.value, color: v.color }));

  const ambienteMap = {};
  tickets.forEach((t) => {
    if (!ambienteMap[t.ambiente]) ambienteMap[t.ambiente] = { atendidos: 0, pendientes: 0 };
    if (t.atendido) ambienteMap[t.ambiente].atendidos += 1;
    else ambienteMap[t.ambiente].pendientes += 1;
  });
  const ambienteData = Object.entries(ambienteMap).map(([name, v]) => ({ name, ...v }));

  return (
    <PanelLayout title="Dashboard" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Panel de Control</h1>
          <p className="pa-section-header__subtitle">Resumen general del sistema de soporte ASIS</p>
        </div>
      </div>

      <div className="pa-stat-grid">
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Tickets Pendientes</span>
          <span className="pa-stat-card__value" style={{ color: '#45B3BF' }}>{abiertos}</span>
          <span className="pa-stat-card__sub">Requieren atención</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Atendidos</span>
          <span className="pa-stat-card__value">{cerrados}</span>
          <span className="pa-stat-card__sub">Resueltos</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Total</span>
          <span className="pa-stat-card__value" style={{ color: '#7EC8E3' }}>{tickets.length}</span>
          <span className="pa-stat-card__sub">Histórico completo</span>
        </div>
        <div className="pa-stat-card">
          <span className="pa-stat-card__label">Sin Asignar</span>
          <span className="pa-stat-card__value" style={{ color: '#f87171' }}>{sinAsignar}</span>
          <span className="pa-stat-card__sub">Pendientes de asignar</span>
        </div>
      </div>

      <div className="pa-chart-grid">
        <div className="pa-chart-card">
          <div className="pa-chart-card__header">Estado de Tickets</div>
          <div className="pa-chart-card__body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={estadoData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {estadoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Tickets']} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="pa-chart-card">
          <div className="pa-chart-card__header">Tickets por Ambiente / Sala</div>
          <div className="pa-chart-card__body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ambienteData} margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(27,112,166,0.1)' }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{v}</span>} />
                <Bar dataKey="pendientes" name="Pendientes" stackId="a" fill="#45B3BF" />
                <Bar dataKey="atendidos" name="Atendidos" stackId="a" fill="#1B70A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="pa-card">
        <div className="pa-card__header">Carga por Técnico</div>
        <div className="pa-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tecnicos.map((tec) => {
            const nombreCompleto = `${tec.nombre_u} ${tec.apellidos_u}`;
            const activos = tickets.filter((t) => t.tecnico === nombreCompleto && !t.atendido).length;
            const pct = Math.min(100, Math.round((activos / 5) * 100));
            return (
              <div key={tec.id_usuario} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="pa-avatar pa-avatar--md">{`${tec.nombre_u[0]}${tec.apellidos_u[0]}`.toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{nombreCompleto}</span>
                    <span className="pa-table-mono" style={{ fontSize: 12, color: '#45B3BF' }}>{activos} activos</span>
                  </div>
                  <div className="pa-progress-track"><div className="pa-progress-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              </div>
            );
          })}
          {tecnicos.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No hay técnicos registrados.</p>}
        </div>
      </div>
    </PanelLayout>
  );
}

export default PanelMesaAyuda;
