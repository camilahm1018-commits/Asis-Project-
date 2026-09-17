// src/pages/tecnico/MisTicketsTecnico.jsx
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import TicketDetailPanel from '../../components/TicketDetailPanel.jsx';
import { navItemsTecnico } from './navItems.js';
import {
  listarTicketsAdministrador, listarEstadosTicket, listarTiposEquipo,
  actualizarEstadoTicketConHistorial, editarTicket, crearNotificacion, obtenerUsuarioActual,
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
        id_estado: Number(idEstado),
        atendido: marcarAtendido,
        accion,
        observacion,
        estado_resultante: estadoElegido?.nombre_e || '',
        id_usuario: usuarioActual?.id_usuario,
      });

      if (marcarAtendido) {
        await editarTicket(ticket.id, { fecha_retorno: new Date().toISOString() });
        await crearNotificacion({
          canal: 'app',
          mensaje: `Tu ticket #${ticket.id} fue atendido y quedó en estado "${estadoElegido?.nombre_e}".`,
          enviada: false,
          id_ticket: ticket.id,
          notificado_para: ticket.idCreadoPor, // Usamos el ID que ahora sí llega bien
          notificado_por: usuarioActual?.id_usuario,
        });
      }

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
            <div className="pa-detail-block" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#fff' }}>{typeof ticket.titulo === 'string' ? ticket.titulo : (typeof ticket.motivo === 'string' ? ticket.motivo : 'Sin descripción')}</p>
              <p style={{ fontSize: 12, margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>{ticket.equipo} · {ticket.ambiente}</p>
            </div>
            {error && <p className="pa-error" style={{ padding: 0, textAlign: 'left', marginBottom: 16 }}>{error}</p>}
            
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
              <textarea className="pa-textarea" rows={4} value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Describe el trabajo realizado..." />
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
              <input type="checkbox" checked={marcarAtendido} onChange={(e) => setMarcarAtendido(e.target.checked)} />
              Marcar este ticket como atendido
            </label>
            
            <div className="pa-modal__actions" style={{ marginTop: 24 }}>
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
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [actualizando, setActualizando] = useState(null);
  const [viendoDetalle, setViendoDetalle] = useState(null);
  const usuario = obtenerUsuarioActual();

  async function cargar() {
    try {
      setCargando(true);
      const [t, es, te] = await Promise.all([listarTicketsAdministrador(), listarEstadosTicket(), listarTiposEquipo()]);
      setTickets(t || []);
      setEstados(es || []);
      setTiposEquipo(te || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  // 🔍 DIAGNÓSTICO: Ver qué está llegando
  console.log("👤 Técnico logueado ID:", usuario?.id_usuario);
  if (tickets.length > 0) {
    console.log("🎫 Primer ticket recibido:", { id: tickets[0].id, idTecnico: tickets[0].idTecnico, tecnicoNombre: tickets[0].tecnico });
  }

  const mapaTipos = Object.fromEntries(tiposEquipo.map((t) => [t.id_tipo, t.nombre_t]));
  
  // ✅ FILTRADO SEGURO POR ID
  const misTickets = tickets.filter((t) => {
    const coincide = String(t.idTecnico) === String(usuario?.id_usuario);
    console.log(`Ticket #${t.id}: idTecnico=${t.idTecnico}, mi ID=${usuario?.id_usuario} → ${coincide ? '✅ SÍ' : '❌ NO'}`);
    return coincide;
  });

  const estadosDisponibles = ['Todos', ...new Set(misTickets.map((t) => t.estado))];
  const tiposDisponibles = ['Todos', ...new Set(misTickets.map((t) => mapaTipos[t.id_tipo]).filter(Boolean))];

  const filtered = misTickets
    .filter((t) => filtro === 'Todos' || t.estado === filtro)
    .filter((t) => filtroTipo === 'Todos' || mapaTipos[t.id_tipo] === filtroTipo);

  return (
    <PanelLayout title="Mis Tickets" rol="tecnico" sidebarLabel="Técnico" navItems={navItemsTecnico}>
      {actualizando && (
        <ModalActualizarTicket
          ticket={actualizando}
          estados={estados}
          onClose={() => setActualizando(null)}
          onGuardado={() => { setActualizando(null); cargar(); }}
        />
      )}
      {viendoDetalle && <TicketDetailPanel ticket={viendoDetalle} onClose={() => setViendoDetalle(null)} />}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Mis Tickets Asignados</h1>
          <p className="pa-section-header__subtitle">Gestiona el estado y el historial de tus reparaciones</p>
        </div>
      </div>

      <div className="pa-filter-row" style={{ marginBottom: '8px' }}>
        {estadosDisponibles.map((f) => (
          <button key={f} className={`pa-filter-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)} type="button">
            {f}
          </button>
        ))}
      </div>
      
      {tiposDisponibles.length > 2 && (
        <div className="pa-filter-row" style={{ marginBottom: '24px' }}>
          {tiposDisponibles.map((tp) => (
            <button key={tp} className={`pa-filter-pill${filtroTipo === tp ? ' active' : ''}`} onClick={() => setFiltroTipo(tp)} type="button">
              {tp === 'Todos' ? 'Todos los tipos' : tp}
            </button>
          ))}
        </div>
      )}

      {cargando && <p className="pa-loading">Cargando tus tickets...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((t) => (
            <div 
              key={t.id} 
              className="pa-card" 
              style={{ padding: 20, cursor: 'pointer', transition: 'background 0.2s' }} 
              onClick={() => setViendoDetalle(t)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="pa-table-mono" style={{ fontSize: 12, fontWeight: 700, color: '#45B3BF' }}>#{t.id}</span>
                  <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>
                    {t.estado}
                  </span>
                  {mapaTipos[t.id_tipo] && (
                    <span className="pa-badge pa-badge--neutral" style={{ fontSize: 11 }}>{mapaTipos[t.id_tipo]}</span>
                  )}
                </div>
                <span className="pa-table-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}
                </span>
              </div>
              
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: '#fff' }}>
                {t.motivo || t.titulo}
              </h3>
              
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📍 {t.ambiente || 'Ambiente no especificado'}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>💻 {t.equipo || 'Equipo no especificado'}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(27,112,166,0.15)', paddingTop: 12 }}>
                <button
                  type="button"
                  className="pa-btn-primary"
                  style={{ padding: '8px 16px', fontSize: 13, borderRadius: '8px' }}
                  onClick={(e) => { 
                    e.stopPropagation();
                    setActualizando(t); 
                  }}
                >
                  ⚙️ Actualizar estado
                </button>
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="pa-card" style={{ padding: 64, textAlign: 'center' }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🎉</span>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>No hay tickets asignados a tu usuario con este filtro.</p>
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
}

export default MisTicketsTecnico;