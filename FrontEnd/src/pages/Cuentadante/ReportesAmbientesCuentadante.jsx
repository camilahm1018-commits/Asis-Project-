// src/pages/Cuentadante/ReportesAmbientesCuentadante.jsx
// Ruta: /cuentadante/reportes-ambientes
// Reportes de equipos y mobiliario de los ambientes a cargo. Solo lectura.
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import TicketDetailPanel from '../../components/TicketDetailPanel.jsx';
import ImagenTicket from '../../components/ImagenTicket.jsx';
import { navItemsCuentadante } from './navItems.js';
import { listarTicketsAdministrador, obtenerUsuarioActual } from '../../services/adminService.js';

function ReportesAmbientesCuentadante() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroAmbiente, setFiltroAmbiente] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState(null);
  const idUsuario = obtenerUsuarioActual()?.id_usuario;

  useEffect(() => {
    async function cargar() {
      try {
        setTickets(await listarTicketsAdministrador());
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  // Tickets de equipos o mobiliario que están en ambientes de este cuentadante
  const deMisAmbientes = tickets.filter((t) => idUsuario != null && t.idCuentadante === idUsuario);
  const estados = ['Todos', ...new Set(deMisAmbientes.map((t) => t.estado))];
  const ambientes = ['Todos', ...new Set(deMisAmbientes.map((t) => t.ambiente))];
  const pendientes = deMisAmbientes.filter((t) => t.estado === 'Pendiente').length;

  const filtered = deMisAmbientes
    .filter((t) =>
      (filtroEstado === 'Todos' || t.estado === filtroEstado) &&
      (filtroAmbiente === 'Todos' || t.ambiente === filtroAmbiente)
    )
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <PanelLayout title="Reportes de Ambientes" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      {seleccionado && (
        <>
          <TicketDetailPanel ticket={seleccionado} onClose={() => setSeleccionado(null)} />
          <ImagenTicket imagen={seleccionado.imagen} />
        </>
      )}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Reportes de Ambientes</h1>
          <p className="pa-section-header__subtitle">
            Reportes de equipos y mobiliario de los ambientes a tu cargo · {pendientes} pendiente{pendientes === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="pa-filter-row">
        {estados.map((f) => (
          <button key={f} className={`pa-filter-pill${filtroEstado === f ? ' active' : ''}`} onClick={() => setFiltroEstado(f)} type="button">{f}</button>
        ))}
      </div>
      <div className="pa-filter-row">
        {ambientes.map((f) => (
          <button key={f} className={`pa-filter-pill${filtroAmbiente === f ? ' active' : ''}`} onClick={() => setFiltroAmbiente(f)} type="button">{f}</button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando reportes...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        filtered.length === 0 ? (
          <div className="pa-card" style={{ padding: 64, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No hay reportes en esta categoría</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((t) => (
              <div key={t.id} className="pa-card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setSeleccionado(t)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="pa-table-mono" style={{ fontSize: 12, fontWeight: 700, color: '#45B3BF' }}>#{t.id}</span>
                    <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span>
                    {t.tipoSalida && <span className="pa-badge pa-badge--accent">{t.tipoSalida}</span>}
                    <span className="pa-badge pa-badge--info">{t.tipoElemento}</span>
                  </div>
                  <span className="pa-table-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px', color: '#fff' }}>{t.titulo}</h3>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid rgba(27,112,166,0.15)' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{t.tipoElemento === 'mobiliario' ? '🪑' : '💻'} {t.equipo}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{t.ambiente}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Reportó: {t.creadoPor}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    Técnico: <span style={{ color: t.tecnico === 'Sin asignar' ? '#f87171' : '#45B3BF' }}>{t.tecnico}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </PanelLayout>
  );
}

export default ReportesAmbientesCuentadante;