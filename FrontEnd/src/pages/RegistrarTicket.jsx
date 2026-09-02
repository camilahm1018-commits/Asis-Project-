import { useState } from 'react'
import { Link } from 'react-router-dom'
import BarraSuperior from '../components/BarraSuperior.jsx'
import '../styles/ticketsGlobal.css'
import '../styles/Registrar_t.css'

const initialForm = {
  motivo: '',
  fecha_salida: '',
  id_equipo: '',
  id_ambiente: '',
  creado_por: ''
}

function RegistrarTicket() {
  const [form, setForm] = useState(initialForm)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'exito' | 'error', texto: string }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje(null)

    const payload = {
      motivo: form.motivo,
      fecha_salida: form.fecha_salida,
      id_equipo: form.id_equipo,
      id_ambiente: form.id_ambiente,
      creado_por: form.creado_por
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        setMensaje({ tipo: 'exito', texto: 'Ticket registrado correctamente.' })
        setForm(initialForm)
      } else {
        setMensaje({ tipo: 'error', texto: data.detail || 'No se pudo registrar el ticket.' })
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' })
    }
  }

  return (
    <>
      <BarraSuperior
        subtitulo="Registrar ticket de daño · CGMLTI"
        rol="Cuentadante"
        iniciales="JR"
      />

      <main className="contenidoFormulario">
        <div className="encabezadoPagina">
          <h1>Registrar ticket</h1>
          <p>Diligencia los datos del daño reportado para crear un nuevo ticket de seguimiento.</p>
        </div>

        <form className="tarjetaFormulario" onSubmit={handleSubmit}>
          {mensaje && (
            <p className={`mensajeFormulario ${mensaje.tipo}`}>{mensaje.texto}</p>
          )}

          <div className="tituloSeccion">Datos del reporte</div>
          <div className="cuadriculaFormulario">
            <div className="campoFormulario campoCompleto">
              <label htmlFor="motivo">Motivo del ticket</label>
              <textarea
                id="motivo"
                name="motivo"
                rows="4"
                placeholder="Describe la falla o el daño presentado…"
                maxLength={255}
                required
                value={form.motivo}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="campoFormulario">
              <label htmlFor="fecha_salida">Fecha de salida</label>
              <input
                type="date"
                id="fecha_salida"
                name="fecha_salida"
                required
                value={form.fecha_salida}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="tituloSeccion">Activo relacionado</div>
          <div className="cuadriculaFormulario">
            <div className="campoFormulario">
              <label htmlFor="id_equipo">Equipo</label>
              <select id="id_equipo" name="id_equipo" required value={form.id_equipo} onChange={handleChange}>
                <option value="">Seleccione un equipo…</option>
                <option value="1">Computador de escritorio — HP EliteDesk (HP-88213X)</option>
                <option value="2">Computador portátil — Lenovo ThinkPad (LN-TP-11245)</option>
                <option value="3">Televisor — Samsung (SM-TV-77210)</option>
                <option value="4">Computador de escritorio — HP EliteDesk (HP-88234X)</option>
              </select>
            </div>

            <div className="campoFormulario">
              <label htmlFor="id_ambiente">Ambiente</label>
              <select id="id_ambiente" name="id_ambiente" required value={form.id_ambiente} onChange={handleChange}>
                <option value="">Seleccione un ambiente…</option>
                <option value="1">Ambiente 204 · Bloque C</option>
                <option value="2">Ambiente 310 · Bloque A</option>
                <option value="3">Ambiente 112 · Bloque B</option>
                <option value="4">Auditorio Principal</option>
                <option value="5">Sala de Sistemas 1</option>
              </select>
            </div>
          </div>

          <div className="tituloSeccion">Personas</div>
          <div className="cuadriculaFormulario">
            <div className="campoFormulario">
              <label htmlFor="creado_por">Reportado por</label>
              <select id="creado_por" name="creado_por" required value={form.creado_por} onChange={handleChange}>
                <option value="">Seleccione un usuario…</option>
                <option value="1">Laura Gómez (Instructora)</option>
                <option value="2">Carlos Peña (Instructor)</option>
                <option value="3">Marcela Duarte (Instructora)</option>
                <option value="4">Diego Salazar (Instructor)</option>
              </select>
            </div>
          </div>

          <div className="accionesFormulario">
            <Link to="/tickets/consultar" className="btnSecundario">Cancelar</Link>
            <button type="submit" className="btnPrincipal">Registrar ticket</button>
          </div>
        </form>
      </main>
    </>
  )
}

export default RegistrarTicket
