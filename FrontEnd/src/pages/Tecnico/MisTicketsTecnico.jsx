// src/pages/tecnico/MisTicketsTecnico.jsx
// Ruta: /tecnico/tickets
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsTecnico } from './navItems.js';
import {
  listarTicketsAdministrador, listarEstadosTicket, actualizarEstadoTicketConHistorial, obtenerUsuarioActual,
} from '../../services/adminService.js';

const accionesSugeridas = [
  'Diagnóstico inicial', 'Reparación de hardware', 'Reinstalación de software',
  'Configuración de red', 'Reemplazo de componente', 'Mantenimiento preventivo', 'Ticket resuelto',
];

function ModalActualizarTicket({ ticket, estados, onClose, onGuardado }) {
  const [idEstado, setIdEstado] = useState('');
  const [accion, setAccion] = useState('');
  const [observacion, setObservacion] = useState('');
  const [marcarAtendido, setMarcarAtendido] = useState(ticket.atendido);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleGuardar(e) {
    e.preventDefault();
    if (!idEstado || !accion) {
      setError('Selecciona el nuevo estado y la acción realizada.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const usuarioActual = obtenerUsuarioActual();
      const estadoElegido = estados.find((es) => es.id_estado === Number(idEstado));
      await actualizarEstadoTicketConHistorial(ticket.id, {
        idEstado: Number(idEstado),
        atendido: marcarAtendido,
        accion,
        observacion,
        estadoResultante: estadoElegido?.nombre_e || '',
        idUsuario: usuarioActual?.id_usuario,
      });
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="pa-modal-overlay" onClick={onClose}>
      <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pa-modal__header">
          <h2 className="pa-modal__title">Actualizar Ticket — #{ticket.id}</h2>
          <button className="pa-modal__close" onClick={onClose} type="button">✕</button>
        </div>
        <form onSubmit={handleGuardar}>
          <div className="pa-modal__body">
            <div className="pa-detail-block">
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#fff' }}>{ticket.titulo}</p>
              <p style={{ fontSize: 12, margin: 0, color: 'rgba(255,255,255,0.5)' }}>{ticket.equipo} · {ticket.ambiente}</p>
            </div>
            {error && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{error}</p>}
            <div className="pa-form-field">
              <label>Nuevo Estado</label>
              <select className="pa-select" value={idEstado} onChange={(e) => setIdEstado(e.target.value)} required>
                <option value="">Seleccionar...</option>
                {estados.map((es) => (
                  <option key={es.id_estado} value={es.id_estado}>{es.nombre_e}</option>
                ))}
              </select>
            </div>
            <div className="pa-form-field">
              <label>Acción Realizada</label>
              <select className="pa-select" value={accion} onChange={(e) => setAccion(e.target.value)} required>
                <option value="">Seleccionar acción...</option>
                {accionesSugeridas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="pa-form-field">
              <label>Observaciones</label>
              <textarea className="pa-textarea" rows={4} value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Describe el trabajo realizado, hallazgos y solución aplicada..." />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              <input type="checkbox" checked={marcarAtendido} onChange={(e) => setMarcarAtendido(e.target.checked)} />
              Marcar este ticket como atendido
            </label>
            <div className="pa-modal__actions">
              <button type="button" className="pa-btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="pa-btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Actualización'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function MisTicketsTecnico() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [estados, setEstados] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState(null);
  const usuario = obtenerUsuarioActual();

  async function cargar() {
    try {
      setCargando(true);
      const [t, es] = await Promise.all([listarTicketsAdministrador(), listarEstadosTicket()]);
      setTickets(t);
      setEstados(es || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellidos}` : '';
  const misTickets = tickets.filter((t) => t.tecnico === nombreCompleto);
  const estadosDisponibles = ['Todos', ...new Set(misTickets.map((t) => t.estado))];
  const filtered = filtro === 'Todos' ? misTickets : misTickets.filter((t) => t.estado === filtro);

  return (
    <PanelLayout title="Mis Tickets" rol="tecnico" sidebarLabel="Técnico" navItems={navItemsTecnico}>
      {seleccionado && (
        <ModalActualizarTicket
          ticket={seleccionado}
          estados={estados}
          onClose={() => setSeleccionado(null)}
          onGuardado={() => { setSeleccionado(null); cargar(); }}
        />
      )}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Mis Tickets</h1>
          <p className="pa-section-header__subtitle">Tickets asignados a ti — clic para actualizar estado</p>
        </div>
      </div>

      <div className="pa-filter-row">
        {estadosDisponibles.map((f) => (
          <button key={f} className={`pa-filter-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)} type="button">{f}</button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando tus tickets...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((t) => (
            <div key={t.id} className="pa-card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setSeleccionado(t)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="pa-table-mono" style={{ fontSize: 12, fontWeight: 700, color: '#45B3BF' }}>#{t.id}</span>
                  <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span>
                </div>
                <span className="pa-table-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}</span>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px', color: '#fff' }}>{t.titulo}</h3>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📍 {t.ambiente}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>💻 {t.equipo}</span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, background: 'rgba(27,112,166,0.2)', color: '#45B3BF' }}>
                  Clic para actualizar estado →
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="pa-card" style={{ padding: 48, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No hay tickets en esta categoría</p>
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
}

export default MisTicketsTecnico;
