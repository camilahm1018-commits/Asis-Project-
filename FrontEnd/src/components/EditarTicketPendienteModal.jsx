// src/components/EditarTicketPendienteModal.jsx
//
// Solo dejo editar el motivo y el equipo mientras el ticket sigue en
// "Pendiente" — una vez un técnico empieza a trabajarlo ya no tiene
// sentido que el que lo creó lo cambie (RF-009).
import { useState } from 'react'
import { editarTicket, listarEquipos } from '../services/adminService.js'
import { useEffect } from 'react'

function EditarTicketPendienteModal({ ticket, onClose, onGuardado }) {
  const [equipos, setEquipos] = useState([])
  const [motivo, setMotivo] = useState(ticket.motivo || ticket.titulo || '')
  const [equipoId, setEquipoId] = useState(ticket.idEquipo)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listarEquipos().then((e) => setEquipos(e || []))
  }, [])

  async function handleGuardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await editarTicket(ticket.id, { motivo, id_equipo: Number(equipoId) })
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="pa-modal-overlay" onClick={onClose}>
      <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pa-modal__header">
          <h2 className="pa-modal__title">Editar Reporte — #{ticket.id}</h2>
          <button className="pa-modal__close" onClick={onClose} type="button">✕</button>
        </div>
        <form onSubmit={handleGuardar}>
          <div className="pa-modal__body">
            {error && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{error}</p>}
            <div className="pa-form-field">
              <label>Equipo</label>
              <select className="pa-select" value={equipoId} onChange={(e) => setEquipoId(e.target.value)} required>
                {equipos.map((eq) => (
                  <option key={eq.id_equipo} value={eq.id_equipo}>{eq.nombre} — {eq.codigo}</option>
                ))}
              </select>
            </div>
            <div className="pa-form-field">
              <label>Descripción del problema</label>
              <textarea className="pa-textarea" rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
            </div>
            <div className="pa-modal__actions">
              <button type="button" className="pa-btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="pa-btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarTicketPendienteModal
