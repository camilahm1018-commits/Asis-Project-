import { useState } from 'react'
import BarraSuperior from '../components/BarraSuperior.jsx'
import '../styles/Cambio_de_estado_tickets.css'

function CambioEstadoTicket() {
  const [estado, setEstado] = useState('Pendiente')
  const [observacion, setObservacion] = useState('')
  const [mostrarAlerta, setMostrarAlerta] = useState(false)

  const handleGuardar = () => {
    setMostrarAlerta(true)
    setTimeout(() => setMostrarAlerta(false), 4000)
  }

  return (
    <>
      <BarraSuperior
        subtitulo="Gestión y trazabilidad de tickets · CGMLTI"
        rol="Técnico de mesa de ayuda"
        iniciales="JR"
      />

      {/* Tarjeta principal */}
      <div className="ticket">
        <h2>Ticket #001</h2>

        <div className="informacionTicket">
          <div className="dato">
            <strong>Activo</strong>
            <p>Computador HP ProDesk 400</p>
          </div>
          <div className="dato">
            <strong>Ubicación</strong>
            <p>Ambiente 305</p>
          </div>
          <div className="dato">
            <strong>Instructor</strong>
            <p>Carlos Gómez</p>
          </div>
          <div className="dato">
            <strong>Fecha de reporte</strong>
            <p>02/07/2026</p>
          </div>
        </div>

        <hr />

        <p><strong>Estado actual:</strong> Pendiente</p>

        <h3>Seguimiento del ticket</h3>

        <div className="progreso">
          <div className="paso activo">
            <span>🔴</span>
            <p>Pendiente</p>
          </div>
          <div>➜</div>
          <div className="paso">
            <span>🟠</span>
            <p>En reparación</p>
          </div>
          <div>➜</div>
          <div className="paso">
            <span>🟡</span>
            <p>Reparado</p>
          </div>
          <div>➜</div>
          <div className="paso">
            <span>🟢</span>
            <p>Entregado</p>
          </div>
        </div>

        <hr />

        <label htmlFor="estado">Nuevo estado</label>
        <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option>Pendiente</option>
          <option>En reparación</option>
          <option>Reparado</option>
          <option>Entregado</option>
          <option>Sin reparación</option>
          <option>Inactivar ticket</option>
        </select>

        <label htmlFor="observacion">Observación</label>
        <textarea
          id="observacion"
          rows="4"
          placeholder="Ingrese una observación sobre el cambio de estado..."
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        ></textarea>

        <button id="guardarCambio" type="button" onClick={handleGuardar}>
          Guardar cambio
        </button>

        <div id="alerta" className="alerta" style={{ display: mostrarAlerta ? 'block' : 'none' }}>
          <h3>✔ Cambio realizado correctamente</h3>
          <p>Notificación enviada correctamente.</p>
        </div>

        <div className="infoSistema">
          <strong>Información</strong>
          <p>
            Cada cambio de estado queda registrado en el historial del ticket y
            se notifica automáticamente al instructor y al cuentadante.
          </p>
        </div>
      </div>
    </>
  )
}

export default CambioEstadoTicket
