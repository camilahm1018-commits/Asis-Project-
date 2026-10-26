// src/components/TicketDetailPanel.jsx
// Detalle completo de un ticket (equipo, personas, fechas) con su historial
// de acciones (RF-012). Se muestra como tarjeta centrada con animación de
// entrada y de salida. Reutilizado por todos los paneles que listan tickets.
import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerHistorialDeTicket } from '../services/adminService.js';
import '../styles/ticketDetalle.css';

const DURACION_SALIDA = 380; // ms, igual que la animación td-rasga-* del CSS

const formatearFecha = (valor) =>
  valor
    ? new Date(valor).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

function Campo({ label, value, clase = '' }) {
  const vacio = value === null || value === undefined || value === '';
  return (
    <div className="td-campo">
      <dt>{label}</dt>
      <dd className={vacio ? 'td-vacio' : clase}>{vacio ? '—' : value}</dd>
    </div>
  );
}

function TicketDetailPanel({ ticket, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [saliendo, setSaliendo] = useState(false);
  const cerrando = useRef(false);
  const temporizador = useRef(null);
  const botonCerrar = useRef(null);

  // Historial del ticket
  useEffect(() => {
    let activo = true;
    setCargandoHistorial(true);
    obtenerHistorialDeTicket(ticket.id)
      .then((h) => { if (activo) setHistorial(Array.isArray(h) ? h : []); })
      .catch(() => { if (activo) setHistorial([]); })
      .finally(() => { if (activo) setCargandoHistorial(false); });
    return () => { activo = false; };
  }, [ticket.id]);

  // Cierra con animación de salida; con "reducir movimiento" cierra de una vez
  const cerrar = useCallback(() => {
    if (cerrando.current) return;
    cerrando.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    setSaliendo(true);
    temporizador.current = setTimeout(onClose, DURACION_SALIDA);
  }, [onClose]);

  // Esc para cerrar, foco inicial y sin scroll de fondo mientras está abierto
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', alTeclear);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botonCerrar.current?.focus();
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowPrevio;
      clearTimeout(temporizador.current);
    };
  }, [cerrar]);

  const motivo = ticket.motivo || ticket.titulo;
  const sinAsignar = !ticket.tecnico || ticket.tecnico === 'Sin asignar';

  return (
    <div className={`td-overlay ${saliendo ? 'td-overlay--sale' : ''}`} onClick={cerrar}>
      <div
        className={`td-card ${saliendo ? 'td-card--sale' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="td-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="td-top">
          <div className="td-top__fila">
            <span className="td-numero">Ticket #{ticket.id}</span>
            <button ref={botonCerrar} className="td-cerrar" onClick={cerrar} type="button" aria-label="Cerrar detalle">
              ✕
            </button>
          </div>
          <h2 id="td-titulo" className="td-titulo">{motivo}</h2>
          <div className="td-badges">
            <span
              className="pa-badge"
              style={{ background: `${ticket.estadoColor}26`, color: ticket.estadoColor, borderColor: `${ticket.estadoColor}4d` }}
            >
              {ticket.estado}
            </span>
            <span className={`pa-badge ${ticket.atendido ? 'pa-badge--success' : 'pa-badge--danger'}`}>
              {ticket.atendido ? 'Atendido' : 'Sin atender'}
            </span>
            {ticket.tipoSalida && <span className="pa-badge pa-badge--accent">{ticket.tipoSalida}</span>}
          </div>
        </header>

        <div className="td-bottom">
          <div className="td-scroll">
            <section>
              <h3 className="td-seccion__titulo">Motivo del ticket</h3>
              <p className="td-motivo">{motivo}</p>
            </section>

            <div className="td-grid">
              <section>
                <h3 className="td-seccion__titulo">Equipo</h3>
                <dl className="td-campos">
                  <Campo label="Equipo" value={ticket.equipo} />
                  <Campo label="Ambiente / Sala" value={ticket.ambiente} />
                </dl>
              </section>

              <section>
                <h3 className="td-seccion__titulo">Personas</h3>
                <dl className="td-campos">
                  <Campo label="Creado por" value={ticket.creadoPor} />
                  <Campo
                    label="Asignado a"
                    value={sinAsignar ? 'Sin asignar' : ticket.tecnico}
                    clase={sinAsignar ? '' : 'td-asignado'}
                  />
                </dl>
              </section>

              <section style={{ gridColumn: '1 / -1' }}>
                <h3 className="td-seccion__titulo">Fechas</h3>
                <dl className="td-campos td-campos--fila">
                  <Campo label="Creado en" value={formatearFecha(ticket.fecha)} />
                  <Campo label="Salida" value={formatearFecha(ticket.fechaSalida)} />
                  <Campo label="Retorno" value={formatearFecha(ticket.fechaRetorno)} />
                </dl>
              </section>
            </div>

            <section>
              <h3 className="td-seccion__titulo">Historial de acciones</h3>
              {cargandoHistorial && <p className="td-aviso">Cargando historial...</p>}
              {!cargandoHistorial && historial.length === 0 && (
                <p className="td-aviso">Todavía no tiene acciones registradas.</p>
              )}
              {historial.length > 0 && (
                <ol className="td-historial">
                  {historial.map((h, i) => (
                    <li key={h.id_historial ?? i} className="td-evento">
                      <div className="td-evento__cabecera">
                        <span className="td-evento__accion">{h.accion}</span>
                        <span className="td-evento__fecha">{formatearFecha(h.fecha) || '—'}</span>
                      </div>
                      {h.observacion && <p className="td-evento__obs">{h.observacion}</p>}
                      {h.estado_resultante && (
                        <span className="td-evento__estado">Quedó en: {h.estado_resultante}</span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetailPanel;
