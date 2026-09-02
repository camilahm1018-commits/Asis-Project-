import { useMemo, useState } from 'react'
import BarraSuperior from '../components/BarraSuperior.jsx'
import '../styles/ticketsGlobal.css'
import '../styles/ambientes.css'

const ESTADOS = [
  { key: 'todos', label: 'Todos', color: 'gris' },
  { key: 'Disponible', label: 'Disponible', color: 'verde' },
  { key: 'Ocupado', label: 'Ocupado', color: 'azul' },
  { key: 'Mantenimiento', label: 'Mantenimiento', color: 'naranja' },
  { key: 'Inactivo', label: 'Inactivo', color: 'negro' }
]

const ESTADO_A_BARRA = {
  Disponible: 'verde',
  Ocupado: 'azul',
  Mantenimiento: 'naranja',
  Inactivo: 'negro'
}

const AMBIENTES_INICIALES = [
  {
    codigo: 'AMB-204',
    nombre: 'Sala de Sistemas 204',
    descripcion: 'Ambiente equipado con computadores para formación ADSO.',
    bloque: 'Bloque C',
    capacidad: 35,
    estado: 'Disponible'
  }
]

const formVacio = {
  codigo: '',
  nombre: '',
  bloque: '',
  piso: '',
  tipo: '',
  estado: 'Disponible',
  capacidad: '',
  computadores: '',
  videobeam: '',
  aire: 'Sí',
  instructor: '',
  descripcion: ''
}

function ConsultarAmbientes() {
  const [ambientes, setAmbientes] = useState(AMBIENTES_INICIALES)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [form, setForm] = useState(formVacio)
  const [ambienteAEliminar, setAmbienteAEliminar] = useState(null)

  const contadores = useMemo(() => {
    const c = { todos: ambientes.length }
    ESTADOS.slice(1).forEach((e) => {
      c[e.key] = ambientes.filter((a) => a.estado === e.key).length
    })
    return c
  }, [ambientes])

  const resultados = useMemo(() => {
    return ambientes.filter((a) => {
      if (filtroEstado !== 'todos' && a.estado !== filtroEstado) return false
      if (busqueda) {
        const haystack = (a.codigo + ' ' + a.nombre + ' ' + a.bloque).toLowerCase()
        if (!haystack.includes(busqueda.toLowerCase())) return false
      }
      return true
    })
  }, [ambientes, filtroEstado, busqueda])

  const abrirRegistro = () => {
    setForm(formVacio)
    setPanelAbierto(true)
  }

  const cerrarPanel = () => setPanelAbierto(false)

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleGuardarAmbiente = (e) => {
    e.preventDefault()
    if (!form.codigo || !form.nombre) return

    setAmbientes((prev) => [
      ...prev,
      {
        codigo: form.codigo,
        nombre: form.nombre,
        descripcion: form.descripcion,
        bloque: form.bloque || '—',
        capacidad: form.capacidad || '—',
        estado: form.estado
      }
    ])
    setPanelAbierto(false)
  }

  const confirmarEliminar = () => {
    setAmbientes((prev) => prev.filter((a) => a.codigo !== ambienteAEliminar.codigo))
    setAmbienteAEliminar(null)
  }

  return (
    <>
      <BarraSuperior
        subtitulo="Gestión de Ambientes de Formación"
        rol="Administrador"
        iniciales="AF"
      />

      <div className="diseno">
        {/* FILTROS */}
        <aside className="filtros">
          <h3>Estado del ambiente</h3>
          <ul className="listaEstados">
            {ESTADOS.map((e) => (
              <li
                key={e.key}
                className={`itemEstado${filtroEstado === e.key ? ' activo' : ''}`}
                onClick={() => setFiltroEstado(e.key)}
              >
                <span className={`punto ${e.color}`}></span>
                {e.label}
                <span className="contador">{contadores[e.key] ?? 0}</span>
              </li>
            ))}
          </ul>

          <div className="leyenda">
            <h3>Convención</h3>
            <div className="filaLeyenda"><span className="punto verde"></span>Disponible</div>
            <div className="filaLeyenda"><span className="punto azul"></span>Ocupado</div>
            <div className="filaLeyenda"><span className="punto naranja"></span>Mantenimiento</div>
            <div className="filaLeyenda"><span className="punto negro"></span>Inactivo</div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="contenidoPrincipal">
          <div className="encabezadoPagina">
            <h1>Gestión de Ambientes</h1>
            <p>Administre los ambientes de formación registrados dentro de la institución.</p>
          </div>

          <div className="barraHerramientas">
            <div className="cajaBusqueda">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Buscar por código, nombre o bloque..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <select>
              <option>Tipo de ambiente</option>
              <option>Sala de Sistemas</option>
              <option>Laboratorio</option>
              <option>Aula</option>
              <option>Taller</option>
            </select>

            <select>
              <option>Bloque</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>

            <select>
              <option>Ordenar</option>
              <option>Más reciente</option>
              <option>Más antiguo</option>
            </select>

            <button className="btnRegistrar" onClick={abrirRegistro}>
              + Registrar Ambiente
            </button>
          </div>

          <p className="contadorResultados">
            {resultados.length} {resultados.length === 1 ? 'ambiente encontrado' : 'ambientes encontrados'}
          </p>

          <div className="listaAmbientes">
            {resultados.map((a) => (
              <div className="tarjetaAmbiente" key={a.codigo}>
                <div className={`barraEstado ${ESTADO_A_BARRA[a.estado] || 'gris'}`}></div>

                <div className="cuerpoAmbiente">
                  <div className="codigoAmbiente">{a.codigo}</div>

                  <div className="infoAmbiente">
                    <div className="nombreAmbiente">{a.nombre}</div>
                    <div className="descripcionAmbiente">{a.descripcion}</div>
                  </div>

                  <div className="ubicacionAmbiente">{a.bloque}</div>

                  <div className="capacidadAmbiente">
                    Capacidad
                    <br />
                    <b>{a.capacidad} Aprendices</b>
                  </div>

                  <div className="estadoDisponible">{a.estado}</div>

                  <div className="acciones">
                    <button className="editar">Editar</button>
                    <button className="eliminar" onClick={() => setAmbienteAEliminar(a)}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* PANEL LATERAL */}
      <div className={`superposicion${panelAbierto ? ' visible' : ''}`} onClick={cerrarPanel}
           style={{ display: panelAbierto ? 'block' : 'none' }}></div>
      <div className={`panelDetalle${panelAbierto ? ' visible' : ''}`}>
        <div className="encabezadoPanel">
          <div>
            <h2>Registrar Ambiente</h2>
            <div className="subtitulo">Complete la información del ambiente.</div>
          </div>
          <button className="botonCerrar" onClick={cerrarPanel}>✕</button>
        </div>

        <div className="cuerpoPanel">
          <form className="formularioAmbiente" onSubmit={handleGuardarAmbiente}>
            <div className="grupoFormulario">
              <label htmlFor="codigo">Código *</label>
              <input type="text" id="codigo" name="codigo" placeholder="Ej. AMB-204" value={form.codigo} onChange={handleFormChange} required />
            </div>

            <div className="grupoFormulario">
              <label htmlFor="nombre">Nombre del ambiente *</label>
              <input type="text" id="nombre" name="nombre" placeholder="Sala de Sistemas 204" value={form.nombre} onChange={handleFormChange} required />
            </div>

            <div className="filaFormulario">
              <div className="grupoFormulario">
                <label>Bloque *</label>
                <select name="bloque" value={form.bloque} onChange={handleFormChange} required>
                  <option value="">Seleccione</option>
                  <option value="Bloque A">Bloque A</option>
                  <option value="Bloque B">Bloque B</option>
                  <option value="Bloque C">Bloque C</option>
                </select>
              </div>

              <div className="grupoFormulario">
                <label>Piso</label>
                <input type="number" name="piso" placeholder="2" value={form.piso} onChange={handleFormChange} />
              </div>
            </div>

            <div className="filaFormulario">
              <div className="grupoFormulario">
                <label>Tipo de ambiente *</label>
                <select name="tipo" value={form.tipo} onChange={handleFormChange} required>
                  <option value="">Seleccione</option>
                  <option>Sala de Sistemas</option>
                  <option>Laboratorio</option>
                  <option>Taller</option>
                  <option>Aula</option>
                  <option>Auditorio</option>
                </select>
              </div>

              <div className="grupoFormulario">
                <label>Estado *</label>
                <select name="estado" value={form.estado} onChange={handleFormChange} required>
                  <option>Disponible</option>
                  <option>Ocupado</option>
                  <option>Mantenimiento</option>
                  <option>Inactivo</option>
                </select>
              </div>
            </div>

            <div className="filaFormulario">
              <div className="grupoFormulario">
                <label>Capacidad</label>
                <input type="number" name="capacidad" placeholder="35" value={form.capacidad} onChange={handleFormChange} />
              </div>

              <div className="grupoFormulario">
                <label>Computadores</label>
                <input type="number" name="computadores" placeholder="30" value={form.computadores} onChange={handleFormChange} />
              </div>
            </div>

            <div className="filaFormulario">
              <div className="grupoFormulario">
                <label>VideoBeam</label>
                <input type="number" name="videobeam" placeholder="1" value={form.videobeam} onChange={handleFormChange} />
              </div>

              <div className="grupoFormulario">
                <label>Aire acondicionado</label>
                <select name="aire" value={form.aire} onChange={handleFormChange}>
                  <option>Sí</option>
                  <option>No</option>
                </select>
              </div>
            </div>

            <div className="grupoFormulario">
              <label>Instructor encargado</label>
              <input type="text" name="instructor" placeholder="Nombre del instructor" value={form.instructor} onChange={handleFormChange} />
            </div>

            <div className="grupoFormulario">
              <label>Descripción</label>
              <textarea rows="5" name="descripcion" placeholder="Descripción del ambiente..." value={form.descripcion} onChange={handleFormChange}></textarea>
            </div>

            <div className="botonesFormulario">
              <button type="button" className="btnCancelar" onClick={cerrarPanel}>Cancelar</button>
              <button type="submit" className="btnGuardar">Guardar Ambiente</button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL ELIMINAR */}
      <div className="modalEliminar" style={{ display: ambienteAEliminar ? 'flex' : 'none' }}>
        <div className="contenidoModal">
          <h2>Eliminar ambiente</h2>
          <p>¿Está seguro que desea eliminar este ambiente?</p>
          <strong>{ambienteAEliminar ? `${ambienteAEliminar.codigo} - ${ambienteAEliminar.nombre}` : ''}</strong>

          <div className="botonesModal">
            <button className="btnCancelar" onClick={() => setAmbienteAEliminar(null)}>Cancelar</button>
            <button className="btnEliminar" onClick={confirmarEliminar}>Eliminar</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConsultarAmbientes
