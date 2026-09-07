// src/components/TicketDetailPanel.jsx
// Panel deslizante con el detalle completo de un ticket (equipo,
// personas involucradas y fechas). Reutilizado por
// TicketsMesaAyuda.jsx y HistorialMesaAyuda.jsx.
function DetailField({ label, value }) {
  return (
    <div className="pa-detail-field">
      <span className="pa-detail-field__label">{label}</span>
      <span className="pa-detail-field__value">{value ?? '—'}</span>
    </div>
  );
}

function TicketDetailPanel({ ticket, onClose }) {
  return (
    <div className="pa-slideover-overlay" onClick={onClose}>
      <div className="pa-slideover" onClick={(e) => e.stopPropagation()}>
        <div className="pa-slideover__header">
          <div>
            <span className="pa-table-mono" style={{ fontSize: 12, fontWeight: 700, color: '#45B3BF' }}>#{ticket.id}</span>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '2px 0 0', color: '#fff' }}>{ticket.titulo}</p>
          </div>
          <button className="pa-modal__close" onClick={onClose} type="button">✕</button>
        </div>
        <div className="pa-slideover__body">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span
              className="pa-badge"
              style={{ background: `${ticket.estadoColor}26`, color: ticket.estadoColor, borderColor: `${ticket.estadoColor}4d` }}
            >
              {ticket.estado}
            </span>
            <span className={`pa-badge ${ticket.atendido ? 'pa-badge--success' : 'pa-badge--danger'}`}>
              {ticket.atendido ? 'Atendido' : 'Sin atender'}
            </span>
          </div>

          <div className="pa-detail-block">
            <span className="pa-detail-block__title">Motivo del ticket</span>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{ticket.titulo}</p>
          </div>

          <div>
            <span className="pa-detail-block__title" style={{ display: 'block', marginBottom: 10 }}>Equipo</span>
            <div className="pa-detail-block">
              <DetailField label="Equipo" value={ticket.equipo} />
              <DetailField label="Ambiente / Sala" value={ticket.ambiente} />
            </div>
          </div>

          <div>
            <span className="pa-detail-block__title" style={{ display: 'block', marginBottom: 10 }}>Personas</span>
            <div className="pa-detail-block">
              <DetailField label="Creado por" value={ticket.creadoPor} />
              <DetailField
                label="Asignado a"
                value={ticket.tecnico === 'Sin asignar'
                  ? <span style={{ color: 'rgba(255,255,255,0.3)' }}>Sin asignar</span>
                  : <span style={{ color: '#7EC8E3' }}>{ticket.tecnico}</span>}
              />
            </div>
          </div>

          <div>
            <span className="pa-detail-block__title" style={{ display: 'block', marginBottom: 10 }}>Fecha</span>
            <div className="pa-detail-block">
              <DetailField label="Creado en" value={ticket.fecha ? new Date(ticket.fecha).toLocaleString() : '—'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetailPanel;
