// src/components/SalidaEquipoForm.jsx
//
// Acá elijo primero el ambiente y después el equipo, como pide el
// RF-006. Según si la salida es por daño, traslado o préstamo, dejo
// el ticket en el estado que le corresponde y, si es daño, marco el
// equipo como dañado de una vez.
import { useEffect, useState } from 'react'
import {
  listarAmbientes, listarEquipos, listarMobiliario, listarInstructores, listarEstadosTicket, listarMotivosNovedad,
  crearTicket, obtenerUsuarioActual,
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
  const [mobiliario, setMobiliario] = useState([])
  const [tipoItem, setTipoItem] = useState('')       // 'equipo' | 'mobiliario'
  const [mobiliarioId, setMobiliarioId] = useState('')
  const [ambienteId, setAmbienteId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [tipoSalida, setTipoSalida] = useState('')
  const [idMotivoNovedad, setIdMotivoNovedad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [imagen, setImagen] = useState(null)

  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')
  const usuarioActual = obtenerUsuarioActual()
  const esAdmin = usuarioActual?.rol === 'administrador'
  const [instructores, setInstructores] = useState([])
  const [ambienteDestinoId, setAmbienteDestinoId] = useState('')
  const [tipoTraslado, setTipoTraslado] = useState('')   // 'temporal' | 'definitivo'
  const [instructorId, setInstructorId] = useState('')
  const [fechaDevolucion, setFechaDevolucion] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const [a, e, mob, mn, es, ins] = await Promise.all([
          listarAmbientes(), listarEquipos(), listarMobiliario(), listarMotivosNovedad(), listarEstadosTicket(),
          listarInstructores().catch(() => []),
        ])
        setAmbientes(ambientesPermitidos ? a.filter((amb) => ambientesPermitidos.includes(amb.id_ambiente)) : a)
        setEquipos(e || [])
        setMobiliario(mob || [])
        setMotivosNovedad(mn || [])
        setEstados(es || [])
        setInstructores(ins || [])
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
  const mobiliarioDelAmbiente = mobiliario.filter((m) => String(m.id_ambiente) === ambienteId)
  const mobiliarioElegido = mobiliario.find((m) => String(m.id_mobiliario) === mobiliarioId)
  const itemElegido = tipoItem === 'equipo' ? equipoId : mobiliarioId
  const faltanDatosSalida =
    (tipoSalida === 'traslado' && (!ambienteDestinoId || !tipoTraslado)) ||
    (tipoSalida === 'prestamo' && (!instructorId || !fechaDevolucion))

  const hoy = new Date()
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  function buscarIdEstado(nombreBuscado) {
    const encontrado = estados.find((es) => es.nombre_e.toLowerCase() === nombreBuscado.toLowerCase())
    return encontrado ? encontrado.id_estado : estados[0]?.id_estado
  }

  async function handleEnviar(e) {
    e.preventDefault()
    if (!ambienteId || !itemElegido || !tipoSalida || !motivo || faltanDatosSalida) return

    setEnviando(true)
    setErrorEnvio('')

    try {

      const idEstado = tipoSalida === 'dano'
        ? buscarIdEstado('Pendiente')
        : buscarIdEstado('Trasladado')

      await crearTicket({
        motivo,
        id_equipo: tipoItem === 'equipo' ? Number(equipoId) : null,
        id_mobiliario: tipoItem === 'mobiliario' ? Number(mobiliarioId) : null,
        tipo_salida: tipoSalida,
        id_motivo_novedad: idMotivoNovedad ? Number(idMotivoNovedad) : null,
        id_estado: idEstado,
        creado_por: usuarioActual?.id_usuario,
        atendido: false,
        fecha_salida: new Date().toISOString(),
        id_ambiente_destino: tipoSalida === 'traslado' ? Number(ambienteDestinoId) : null,
        traslado_definitivo: tipoSalida === 'traslado' ? tipoTraslado === 'definitivo' : null,
        id_instructor_prestamo: tipoSalida === 'prestamo' ? Number(instructorId) : null,
        fecha_devolucion: tipoSalida === 'prestamo' ? fechaDevolucion : null,
      }, imagen)
      if (tipoSalida === 'traslado' && tipoTraslado === 'definitivo') {
        const destino = Number(ambienteDestinoId)
        if (tipoItem === 'equipo') {
          setEquipos((prev) => prev.map((e) => (e.id_equipo === Number(equipoId) ? { ...e, id_ambiente: destino } : e)))
        } else {
          setMobiliario((prev) => prev.map((m) => (m.id_mobiliario === Number(mobiliarioId) ? { ...m, id_ambiente: destino } : m)))
        }
      }
            setEnviado(true)
      setAmbienteId(''); setTipoItem(''); setEquipoId(''); setMobiliarioId('')
      setTipoSalida(''); setIdMotivoNovedad(''); setMotivo(''); setImagen(null)
      setAmbienteDestinoId(''); setTipoTraslado(''); setInstructorId(''); setFechaDevolucion('')
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
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <form onSubmit={handleEnviar} className="pa-card">
        <div className="pa-card__header">Registrar Salida de Equipo</div>
        <div className="pa-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {errorEnvio && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{errorEnvio}</p>}

          <div className="pa-form-field">
            <label>1. Ambiente</label>
            <select className="pa-select" value={ambienteId} onChange={(e) => { setAmbienteId(e.target.value); setEquipoId(''); setMobiliarioId(''); setAmbienteDestinoId('') }} required>
              <option value="">Seleccionar ambiente...</option>
              {ambientes.map((a) => <option key={a.id_ambiente} value={a.id_ambiente}>{a.nombre_a}</option>)}
            </select>
          </div>

          <div className="pa-form-field">
            <label>2. ¿Qué sale?</label>
            <div className="pa-responsive-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { valor: 'equipo', label: 'Equipo', icono: '💻' },
                { valor: 'mobiliario', label: 'Mobiliario', icono: '🪑' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.valor}
                  disabled={!ambienteId}
                  onClick={() => { setTipoItem(t.valor); setEquipoId(''); setMobiliarioId('') }}
                  className={`pa-select-card${tipoItem === t.valor ? ' selected' : ''}`}
                  style={{ textAlign: 'center', opacity: ambienteId ? 1 : 0.5 }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icono}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                </button>
              ))}
            </div>
            {!ambienteId && (
              <p style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.4)' }}>Primero elige un ambiente</p>
            )}
          </div>

          {tipoItem === 'equipo' && (
            <div className="pa-form-field">
              <label>3. Equipo</label>
              <select className="pa-select" value={equipoId} onChange={(e) => setEquipoId(e.target.value)} required>
                <option value="">Seleccionar equipo...</option>
                {equiposDelAmbiente.map((eq) => (
                  <option key={eq.id_equipo} value={eq.id_equipo}>{eq.nombre} — {eq.codigo}</option>
                ))}
              </select>
            </div>
          )}

          {tipoItem === 'mobiliario' && (
            <div className="pa-form-field">
              <label>3. Mobiliario</label>
              <select className="pa-select" value={mobiliarioId} onChange={(e) => setMobiliarioId(e.target.value)} required>
                <option value="">Seleccionar mobiliario...</option>
                {mobiliarioDelAmbiente.map((m) => (
                  <option key={m.id_mobiliario} value={m.id_mobiliario}>{m.nombre_tm} — {m.serial || m.codigo}</option>
                ))}
              </select>
            </div>
          )}

          {tipoItem === 'equipo' && equipoElegido && (
            <div className="pa-detail-block" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#45B3BF' }}>💻</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, margin: 0, color: 'rgba(255,255,255,0.8)' }}>{equipoElegido.nombre}</p>
                <p style={{ fontSize: 11, margin: 0, color: 'rgba(255,255,255,0.4)' }}>S/N {equipoElegido.serial || '—'}</p>
              </div>
            </div>
          )}

          {tipoItem === 'mobiliario' && mobiliarioElegido && (
            <div className="pa-detail-block" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#45B3BF' }}>🪑</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, margin: 0, color: 'rgba(255,255,255,0.8)' }}>{mobiliarioElegido.nombre_tm}</p>
                <p style={{ fontSize: 11, margin: 0, color: 'rgba(255,255,255,0.4)' }}>S/N {mobiliarioElegido.serial || '—'}</p>
              </div>
            </div>
          )}

          <div className="pa-form-field">
            <label>4. Motivo de la salida</label>
            <div className="pa-responsive-three-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {TIPOS_SALIDA.map((t) => (
                <button
                  type="button"
                  key={t.valor}
                  onClick={() => {setTipoSalida(t.valor)
                    setAmbienteDestinoId(''); setTipoTraslado(''); setInstructorId(''); setFechaDevolucion('')
                  }}
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
          {tipoSalida === 'traslado' && (
            <>
              <div className="pa-form-field">
                <label>5. Ambiente destino</label>
                <select className="pa-select" value={ambienteDestinoId} onChange={(e) => setAmbienteDestinoId(e.target.value)} required>
                  <option value="">Seleccionar ambiente destino...</option>
                  {ambientes
                    .filter((a) => String(a.id_ambiente) !== ambienteId)
                    .map((a) => <option key={a.id_ambiente} value={a.id_ambiente}>{a.nombre_a}</option>)}
                </select>
              </div>

              <div className="pa-form-field">
                <label>Tipo de traslado</label>
                <div className="pa-responsive-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setTipoTraslado('temporal')}
                    className={`pa-select-card${tipoTraslado === 'temporal' ? ' selected' : ''}`}
                    style={{ textAlign: 'center' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Temporal</div>
                  </button>
                  <button
                    type="button"
                    disabled={!esAdmin}
                    title={esAdmin ? '' : 'Solo el administrador puede hacer traslados definitivos'}
                    onClick={() => setTipoTraslado('definitivo')}
                    className={`pa-select-card${tipoTraslado === 'definitivo' ? ' selected' : ''}`}
                    style={{ textAlign: 'center', opacity: esAdmin ? 1 : 0.5 }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Definitivo</div>
                  </button>
                </div>
                <p style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.4)' }}>
                  {tipoTraslado === 'definitivo'
                    ? 'El elemento quedará registrado en el ambiente destino.'
                    : tipoTraslado === 'temporal'
                      ? 'El elemento sigue registrado en su ambiente de origen.'
                      : esAdmin ? 'Elige si el traslado es temporal o definitivo.' : 'Los traslados definitivos los hace el administrador.'}
                </p>
              </div>
            </>
          )}

          {tipoSalida === 'prestamo' && (
            <>
              <div className="pa-form-field">
                <label>5. Instructor que recibe el préstamo</label>
                <select className="pa-select" value={instructorId} onChange={(e) => setInstructorId(e.target.value)} required>
                  <option value="">Seleccionar instructor...</option>
                  {instructores
                    .filter((i) => i.id_usuario !== usuarioActual?.id_usuario)
                    .map((i) => <option key={i.id_usuario} value={i.id_usuario}>{i.nombre_u} {i.apellidos_u}</option>)}
                </select>
              </div>

              <div className="pa-form-field">
                <label>Fecha de devolución</label>
                <input
                  type="date"
                  className="pa-input"
                  min={hoyStr}
                  value={fechaDevolucion}
                  onChange={(e) => setFechaDevolucion(e.target.value)}
                  required
                />
              </div>
            </>
          )}
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

          <button type="submit" className="pa-btn-primary" style={{ width: '100%' }}  disabled={!ambienteId || !itemElegido || !tipoSalida || !motivo.trim() || faltanDatosSalida || enviando}>
            {enviando ? 'Registrando...' : 'Registrar Salida'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SalidaEquipoForm
