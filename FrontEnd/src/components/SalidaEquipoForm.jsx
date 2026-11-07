// src/components/SalidaEquipoForm.jsx
//
// Acá elijo primero el ambiente y después el equipo, como pide el
// RF-006. Según si la salida es por daño, traslado o préstamo, dejo
// el ticket en el estado que le corresponde y, si es daño, marco el
// equipo como dañado de una vez.
import { useEffect, useState } from 'react'
import {
  listarAmbientes, listarEquipos, listarEstadosTicket, listarMotivosNovedad,
  crearTicket, editarEquipo, obtenerUsuarioActual,
} from '../services/adminService.js'

const TIPOS_SALIDA = [
  { valor: 'dano', label: 'Daño', icono: '⚠️', descripcion: 'El equipo presenta una falla y necesita reparación.' },
  { valor: 'traslado', label: 'Traslado', icono: '🔁', descripcion: 'El equipo se traslada a otro ambiente.' },
  { valor: 'prestamo', label: 'Préstamo', icono: '📤', descripcion: 'El equipo sale prestado temporalmente.' },
]

function SalidaEquipoForm({ ambientesPermitidos }) {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ambientes, setAmbientes] = useState([])
  const [equipos, setEquipos] = useState([])
  const [motivosNovedad, setMotivosNovedad] = useState([])
  const [estados, setEstados] = useState([])

  const [ambienteId, setAmbienteId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [tipoSalida, setTipoSalida] = useState('')
  const [idMotivoNovedad, setIdMotivoNovedad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [imagen, setImagen] = useState(null)

  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const [a, e, mn, es] = await Promise.all([
          listarAmbientes(), listarEquipos(), listarMotivosNovedad(), listarEstadosTicket(),
        ])
        setAmbientes(ambientesPermitidos ? a.filter((amb) => ambientesPermitidos.includes(amb.id_ambiente)) : a)
        setEquipos(e || [])
        setMotivosNovedad(mn || [])
        setEstados(es || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [ambientesPermitidos])

  const equiposDelAmbiente = equipos.filter((e) => String(e.id_ambiente) === ambienteId)
  const equipoElegido = equipos.find((e) => String(e.id_equipo) === equipoId)

  function buscarIdEstado(nombreBuscado) {
    const encontrado = estados.find((es) => es.nombre_e.toLowerCase() === nombreBuscado.toLowerCase())
    return encontrado ? encontrado.id_estado : estados[0]?.id_estado
  }

  async function handleEnviar(e) {
    e.preventDefault()
    if (!ambienteId || !equipoId || !tipoSalida || !motivo) return

    setEnviando(true)
    setErrorEnvio('')

    try {
      const usuarioActual = obtenerUsuarioActual()

      const idEstado = tipoSalida === 'dano'
        ? buscarIdEstado('Pendiente')
        : buscarIdEstado('Trasladado')

      await crearTicket({
        motivo,
        id_equipo: Number(equipoId),
        tipo_salida: tipoSalida,
        id_motivo_novedad: idMotivoNovedad ? Number(idMotivoNovedad) : null,
        id_estado: idEstado,
        creado_por: usuarioActual?.id_usuario,
        atendido: false,
        fecha_salida: new Date().toISOString(),
      },imagen)

      if (tipoSalida === 'dano') {
        await editarEquipo(Number(equipoId), { estado: 'dañado' })
      }

      setEnviado(true)
      setAmbienteId(''); setEquipoId(''); setTipoSalida(''); setIdMotivoNovedad(''); setMotivo(''); setImagen(null)
      setTimeout(() => setEnviado(false), 4000)
    } catch (err) {
      setErrorEnvio(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <p className="pa-loading">Cargando formulario...</p>
  if (error) return <p className="pa-error">{error}</p>

  if (enviado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 16px', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: 'rgba(69,179,191,0.15)', border: '1px solid rgba(69,179,191,0.4)' }}>✓</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Salida registrada</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>El equipo quedó registrado con la novedad correspondiente.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <form onSubmit={handleEnviar} className="pa-card">
        <div className="pa-card__header">Registrar Salida de Equipo</div>
        <div className="pa-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {errorEnvio && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{errorEnvio}</p>}

          <div className="pa-form-field">
            <label>1. Ambiente</label>
            <select className="pa-select" value={ambienteId} onChange={(e) => { setAmbienteId(e.target.value); setEquipoId('') }} required>
              <option value="">Seleccionar ambiente...</option>
              {ambientes.map((a) => <option key={a.id_ambiente} value={a.id_ambiente}>{a.nombre_a}</option>)}
            </select>
          </div>

          <div className="pa-form-field">
            <label>2. Equipo</label>
            <select className="pa-select" value={equipoId} onChange={(e) => setEquipoId(e.target.value)} required disabled={!ambienteId}>
              <option value="">{ambienteId ? 'Seleccionar equipo...' : 'Primero elige un ambiente'}</option>
              {equiposDelAmbiente.map((eq) => (
                <option key={eq.id_equipo} value={eq.id_equipo}>{eq.nombre} — {eq.codigo}</option>
              ))}
            </select>
          </div>

          {equipoElegido && (
            <div className="pa-detail-block" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#45B3BF' }}>💻</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, margin: 0, color: 'rgba(255,255,255,0.8)' }}>{equipoElegido.nombre}</p>
                <p style={{ fontSize: 11, margin: 0, color: 'rgba(255,255,255,0.4)' }}>S/N {equipoElegido.serial || '—'}</p>
              </div>
            </div>
          )}

          <div className="pa-form-field">
            <label>3. Motivo de la salida</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {TIPOS_SALIDA.map((t) => (
                <button
                  type="button"
                  key={t.valor}
                  onClick={() => setTipoSalida(t.valor)}
                  className={`pa-select-card${tipoSalida === t.valor ? ' selected' : ''}`}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icono}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                </button>
              ))}
            </div>
            {tipoSalida && (
              <p style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.4)' }}>
                {TIPOS_SALIDA.find((t) => t.valor === tipoSalida)?.descripcion}
              </p>
            )}
          </div>

          <div className="pa-form-field">
            <label>Descripción</label>
            <textarea className="pa-textarea" rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describe qué pasó con el equipo..." required />
          </div>

          <div className="pa-form-field">
            <label>Imagen del equipo (opcional)</label>

            <label className="boton-imagen">
              📷 Seleccionar imagen
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImagen(e.target.files[0] || null)}
                hidden
              />
            </label>

            {imagen && (
              <div className="imagen-seleccionada">
                <span>📎 {imagen.name}</span>
                <button
                  type="button"
                  onClick={() => setImagen(null)}
                  className="quitar-imagen"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

            
          {tipoSalida === 'dano' && (
            <div className="pa-form-field">
              <label>Motivo de novedad (opcional)</label>
              <select className="pa-select" value={idMotivoNovedad} onChange={(e) => setIdMotivoNovedad(e.target.value)}>
                <option value="">Sin especificar</option>
                {motivosNovedad.map((m) => (
                  <option key={m.id_motivo} value={m.id_motivo}>{m.nombre_novedad}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="pa-btn-primary" style={{ width: '100%' }} disabled={!ambienteId || !equipoId || !tipoSalida || !motivo || enviando}>
            {enviando ? 'Registrando...' : 'Registrar Salida'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SalidaEquipoForm
