// src/components/EquipoDetalleCard.jsx
// Card de detalle de un equipo (se muestra al hacer clic sobre un equipo).
// Se usa en: Mis Equipos (instructor) e Inventario (cuentadante).
import { useEffect } from 'react';

const badgeColorPorEstado = {
  activo: 'pa-badge--success',
  dañado: 'pa-badge--danger',
  mantenimiento: 'pa-badge--warning',
  baja: 'pa-badge--neutral',
};

function formatearFecha(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function EquipoDetalleCard({ equipo, tipo, ambiente, tickets = [], onClose }) {
  useEffect(() => {
    if (!equipo) return undefined;
    const alPresionar = (ev) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [equipo, onClose]);

  if (!equipo) return null;

  const ticketsActivos = tickets.filter((t) => !t.atendido).length;
  const campos = [
    { label: 'Marca', value: equipo.marca },
    { label: 'Serial', value: equipo.serial, mono: true },
    { label: 'Tipo', value: tipo },
    { label: 'Ambiente', value: ambiente },
  ];

  return (
    <div className="pa-modal-overlay" onClick={onClose}>
      <div
        className="pa-eqd"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${equipo.nombre}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pa-eqd__header">
          <div className="pa-eqd__icon">
            <span className="material-symbols-rounded">computer</span>
          </div>
          <div className="pa-eqd__heading">
            <h2 className="pa-eqd__name">{equipo.nombre}</h2>
            <span className="pa-eqd__code pa-table-mono">{equipo.codigo}</span>
          </div>
          <button className="pa-modal__close" onClick={onClose} type="button" aria-label="Cerrar">✕</button>
        </div>

        <div className="pa-eqd__body">
          <div className="pa-eqd__status-row">
            <span className={`pa-badge ${badgeColorPorEstado[equipo.estado] || 'pa-badge--neutral'}`}>{equipo.estado}</span>
            {ticketsActivos > 0 && (
              <span className="pa-badge pa-badge--danger">{ticketsActivos} ticket{ticketsActivos > 1 ? 's' : ''} activo{ticketsActivos > 1 ? 's' : ''}</span>
            )}
          </div>

          {equipo.descripcion && <p className="pa-eqd__desc">{equipo.descripcion}</p>}

          <div className="pa-eqd__grid">
            {campos.map((c) => (
              <div key={c.label} className="pa-eqd__field">
                <span className="pa-eqd__label">{c.label}</span>
                <span className={`pa-eqd__value${c.mono ? ' pa-table-mono' : ''}`}>{c.value || '—'}</span>
              </div>
            ))}
          </div>

          <div className="pa-eqd__section">
            <p className="pa-eqd__section-title">Tickets del equipo ({tickets.length})</p>
            {tickets.length === 0 ? (
              <p className="pa-eqd__empty">Sin tickets registrados</p>
            ) : (
              <ul className="pa-eqd__tickets">
                {tickets.map((t) => (
                  <li key={t.id} className="pa-eqd__ticket">
                    <span className="pa-eqd__ticket-id pa-table-mono">#{t.id}</span>
                    <span className="pa-eqd__ticket-info">
                      <span className="pa-eqd__ticket-title">{t.titulo}</span>
                      {t.fecha && <span className="pa-eqd__ticket-date">{formatearFecha(t.fecha)}</span>}
                    </span>
                    <span
                      className="pa-badge"
                      style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}
                    >
                      {t.estado}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipoDetalleCard;
