import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BarraSuperior from '../components/BarraSuperior.jsx'
import '../styles/ticketsGlobal.css'
import '../styles/Consultar_t.css'

/* ---------------- Datos ficticios ---------------- */
const STATUS_META = {
  pendiente: { label: 'Pendiente', color: 'var(--rojo)' },
  reparacion: { label: 'En reparación', color: 'var(--naranja)' },
  reparado: { label: 'Reparado', color: 'var(--amarillo)' },
  entregado: { label: 'Entregado', color: 'var(--verde)' },
  sinreparo: { label: 'Sin reparación', color: 'var(--negro)' },
  inactivo: { label: 'Inactivado', color: 'var(--morado)' }
}

const TICKETS = [
  { id: 'TCK-2026-0041', tipoActivo: 'Equipo', activo: 'Computador de escritorio', marca: 'HP EliteDesk', serie: 'HP-88213X', ubicacion: 'Ambiente 204 · Bloque C', falla: 'No enciende', descripcion: 'El equipo no enciende luego de un corte de energía; el led del case no responde.', estado: 'pendiente', reportadoPor: 'Laura Gómez (Instructora)', tecnico: 'Sin asignar', fecha: '2026-06-28', actualizado: '2026-06-28' },
  { id: 'TCK-2026-0040', tipoActivo: 'Mobiliario', activo: 'Silla ergonómica', marca: '—', serie: '—', ubicacion: 'Ambiente 310 · Bloque A', falla: 'Estructura dañada', descripcion: 'Una de las patas de la silla está partida, riesgo de caída para el usuario.', estado: 'reparacion', reportadoPor: 'Carlos Peña (Instructor)', tecnico: 'Andrés Ruiz', fecha: '2026-06-27', actualizado: '2026-06-30' },
  { id: 'TCK-2026-0039', tipoActivo: 'Equipo', activo: 'Televisor', marca: 'Samsung', serie: 'SM-TV-77210', ubicacion: 'Ambiente 112 · Bloque B', falla: 'Pantalla rota', descripcion: 'La pantalla presenta una fisura en la esquina inferior derecha tras el traslado.', estado: 'reparado', reportadoPor: 'Marcela Duarte (Instructora)', tecnico: 'Julián Ríos', fecha: '2026-06-24', actualizado: '2026-06-29' },
  { id: 'TCK-2026-0038', tipoActivo: 'Equipo', activo: 'Computador de escritorio', marca: 'Hp', serie: 'EP-VB-40982', ubicacion: 'Auditorio Principal', falla: 'Sin señal de imagen', descripcion: 'El videobeam enciende pero no proyecta imagen desde ninguna fuente HDMI.', estado: 'entregado', reportadoPor: 'Diego Salazar (Instructor)', tecnico: 'Julián Ríos', fecha: '2026-06-18', actualizado: '2026-06-25' },
  { id: 'TCK-2026-0037', tipoActivo: 'Mobiliario', activo: 'Mesa de trabajo', marca: '—', serie: '—', ubicacion: 'Taller de Electrónica', falla: 'Superficie deteriorada', descripcion: 'Laminado levantado por humedad, no representa riesgo pero afecta el uso.', estado: 'entregado', reportadoPor: 'Paula Restrepo (Instructora)', tecnico: 'Andrés Ruiz', fecha: '2026-06-15', actualizado: '2026-06-20' },
  { id: 'TCK-2026-0036', tipoActivo: 'Equipo', activo: 'Computador de escritorio', marca: 'Hp', serie: 'EP-IMP-30021', ubicacion: 'Coordinación Académica', falla: 'Atasco de papel constante', descripcion: 'El rodillo de arrastre no toma el papel correctamente en más del 50% de los intentos.', estado: 'sinreparo', reportadoPor: 'Fernando Ávila (Instructor)', tecnico: 'Julián Ríos', fecha: '2026-06-10', actualizado: '2026-06-22' },
  { id: 'TCK-2026-0035', tipoActivo: 'Equipo', activo: 'Computador portátil', marca: 'Lenovo ThinkPad', serie: 'LN-TP-11245', ubicacion: 'Ambiente 205 · Bloque C', falla: 'Batería no carga', descripcion: 'El portátil solo enciende conectado directamente, la batería no retiene carga.', estado: 'pendiente', reportadoPor: 'Laura Gómez (Instructora)', tecnico: 'Sin asignar', fecha: '2026-06-29', actualizado: '2026-06-29' },
  { id: 'TCK-2026-0034', tipoActivo: 'Mobiliario', activo: 'Silla ergonómica', marca: '—', serie: '—', ubicacion: 'Almacén General', falla: 'Cerradura dañada', descripcion: 'La cerradura del segundo cajón no permite el cierre correcto del archivador.', estado: 'inactivo', reportadoPor: 'Sandra Molina (Cuentadante)', tecnico: '—', fecha: '2026-05-30', actualizado: '2026-06-05' },
  { id: 'TCK-2026-0033', tipoActivo: 'Equipo', activo: 'Computador de escritorio', marca: 'Dell OptiPlex', serie: 'DL-OP-77341', ubicacion: 'Sala de Sistemas 1', falla: 'Falla eléctrica', descripcion: 'El equipo se apaga intermitentemente durante la jornada de formación.', estado: 'reparacion', reportadoPor: 'Diego Salazar (Instructor)', tecnico: 'Andrés Ruiz', fecha: '2026-06-26', actualizado: '2026-06-30' },
  { id: 'TCK-2026-0032', tipoActivo: 'Equipo', activo: 'Computador de escritorio', marca: 'TP-Link', serie: 'TP-RT-50291', ubicacion: 'Ambiente 108 · Bloque B', falla: 'Sin conexión a red', descripcion: 'El equipo no distribuye señal Wi-Fi a los puestos de trabajo del ambiente.', estado: 'reparado', reportadoPor: 'Marcela Duarte (Instructora)', tecnico: 'Julián Ríos', fecha: '2026-06-20', actualizado: '2026-06-27' },
  { id: 'TCK-2026-0031', tipoActivo: 'Mobiliario', activo: 'Silla ergonómica', marca: '—', serie: '—', ubicacion: 'Ambiente 204 · Bloque C', falla: 'Espaldar suelto', descripcion: 'El espaldar se desprende del mecanismo de inclinación al recostarse.', estado: 'entregado', reportadoPor: 'Carlos Peña (Instructor)', tecnico: 'Andrés Ruiz', fecha: '2026-06-12', actualizado: '2026-06-19' },
  { id: 'TCK-2026-0030', tipoActivo: 'Equipo', activo: 'Computador de escritorio', marca: 'HP EliteDesk', serie: 'HP-88090T', ubicacion: 'Sala de Sistemas 2', falla: 'Sobrecalentamiento', descripcion: 'El equipo se apaga solo tras aproximadamente 40 minutos de uso continuo.', estado: 'pendiente', reportadoPor: 'Fernando Ávila (Instructor)', tecnico: 'Sin asignar', fecha: '2026-06-30', actualizado: '2026-06-30' }
]

const ESTADOS_FILTRO = [
  { key: 'todos', label: 'Todos', color: '#B9C0CA' },
  { key: 'pendiente', label: 'Pendiente', color: 'var(--rojo)' },
  { key: 'reparacion', label: 'En reparación', color: 'var(--naranja)' },
  { key: 'reparado', label: 'Reparado', color: 'var(--amarillo)' },
  { key: 'entregado', label: 'Entregado', color: 'var(--verde)' },
  { key: 'sinreparo', label: 'Sin reparación', color: 'var(--negro)' },
  { key: 'inactivo', label: 'Inactivado', color: 'var(--morado)' }
]

const HOY = new Date('2026-07-02')

function formatDate(iso) {
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const d = new Date(iso)
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

function daysAgo(dateStr) {
  const d = new Date(dateStr)
  return Math.round((HOY - d) / (1000 * 60 * 60 * 24))
}

function buildHistorial(t) {
  const base = [{ text: 'Ticket registrado por ' + t.reportadoPor, color: 'var(--rojo)', when: formatDate(t.fecha) }]
  const orderSeq = ['pendiente', 'reparacion', 'reparado', 'entregado']
  const idx = orderSeq.indexOf(t.estado)

  if (t.estado === 'sinreparo') {
    base.push({ text: 'Diagnóstico técnico: no es posible reparar el activo', color: 'var(--negro)', when: formatDate(t.actualizado) })
  } else if (t.estado === 'inactivo') {
    base.push({ text: 'Ticket inactivado por el técnico', color: 'var(--morado)', when: formatDate(t.actualizado) })
  } else if (idx > 0) {
    for (let i = 1; i <= idx; i++) {
      base.push({
        text: 'Cambio de estado a "' + STATUS_META[orderSeq[i]].label + '"',
        color: STATUS_META[orderSeq[i]].color,
        when: i === idx ? formatDate(t.actualizado) : formatDate(t.fecha)
      })
    }
  }
  return base
}

function ConsultarTickets() {
  const [activeStatus, setActiveStatus] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoActivoFiltro, setTipoActivoFiltro] = useState('todos')
  const [fechaFiltro, setFechaFiltro] = useState('todos')
  const [orden, setOrden] = useState('reciente')
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null)

  const counts = useMemo(() => {
    const c = { todos: TICKETS.length }
    Object.keys(STATUS_META).forEach((key) => {
      c[key] = TICKETS.filter((t) => t.estado === key).length
    })
    return c
  }, [])

  const resultados = useMemo(() => {
    let result = TICKETS.filter((t) => {
      if (activeStatus !== 'todos' && t.estado !== activeStatus) return false
      if (tipoActivoFiltro !== 'todos' && t.tipoActivo !== tipoActivoFiltro) return false
      if (fechaFiltro !== 'todos' && daysAgo(t.fecha) > parseInt(fechaFiltro)) return false
      if (searchTerm) {
        const haystack = (t.id + ' ' + t.activo + ' ' + t.ubicacion + ' ' + t.reportadoPor).toLowerCase()
        if (!haystack.includes(searchTerm.toLowerCase())) return false
      }
      return true
    })

    result = [...result].sort((a, b) => {
      const da = new Date(a.fecha)
      const db = new Date(b.fecha)
      return orden === 'reciente' ? db - da : da - db
    })

    return result
  }, [activeStatus, tipoActivoFiltro, fechaFiltro, searchTerm, orden])

  const historial = ticketSeleccionado ? buildHistorial(ticketSeleccionado) : []

  return (
    <>
      <BarraSuperior
        subtitulo="Gestión y trazabilidad de tickets · CGMLTI"
        rol="Técnico de mesa de ayuda"
        iniciales="JR"
      />

      <div className="diseno">
        {/* FILTROS */}
        <aside className="filtros">
          <h3>Estado del ticket</h3>
          <ul className="listaEstados">
            {ESTADOS_FILTRO.map((estado) => (
              <li
                key={estado.key}
                className={`itemEstado${activeStatus === estado.key ? ' activo' : ''}`}
                onClick={() => setActiveStatus(estado.key)}
              >
                <span className="punto" style={{ background: estado.color }}></span>
                {estado.label}
                <span className="contador">{counts[estado.key]}</span>
              </li>
            ))}
          </ul>

          <div className="leyenda">
            <h3>Convención de color</h3>
            <div className="filaLeyenda"><span className="punto" style={{ background: 'var(--rojo)' }}></span>Rojo — pendiente</div>
            <div className="filaLeyenda"><span className="punto" style={{ background: 'var(--naranja)' }}></span>Naranja — en reparación</div>
            <div className="filaLeyenda"><span className="punto" style={{ background: 'var(--amarillo)' }}></span>Amarillo — reparado</div>
            <div className="filaLeyenda"><span className="punto" style={{ background: 'var(--verde)' }}></span>Verde — entregado</div>
            <div className="filaLeyenda"><span className="punto" style={{ background: 'var(--negro)' }}></span>Negro — sin reparación</div>
            <div className="filaLeyenda"><span className="punto" style={{ background: 'var(--morado)' }}></span>Morado — inactivado</div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="contenidoPrincipal">
          <div className="encabezadoPagina">
            <h1>Consultar tickets</h1>
            <p>Datos de ejemplo (ficticios) para maquetar la consulta de tickets de daños en equipos y mobiliario.</p>
          </div>

          <div className="barraHerramientas">
            <div className="cajaBusqueda">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por ID, activo, ubicación o instructor…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={tipoActivoFiltro} onChange={(e) => setTipoActivoFiltro(e.target.value)}>
              <option value="todos">Tipo de activo: todos</option>
              <option value="Equipo">Equipo tecnológico</option>
              <option value="Mobiliario">Mobiliario</option>
            </select>
            <select value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)}>
              <option value="todos">Fecha: todas</option>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
            </select>
            <select value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="reciente">Ordenar: más reciente</option>
              <option value="antiguo">Ordenar: más antiguo</option>
            </select>
            <Link
              to="/tickets/registrar"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--brand)',
                color: '#fff',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '13.5px',
                fontWeight: 700
              }}
            >
              + Nuevo ticket
            </Link>
          </div>

          <p className="contadorResultados">
            {resultados.length}{resultados.length === 1 ? ' ticket encontrado' : ' tickets encontrados'}
          </p>

          <div className="listaTickets">
            {resultados.map((t) => {
              const meta = STATUS_META[t.estado]
              return (
                <div
                  key={t.id}
                  className="tarjetaTicket"
                  tabIndex={0}
                  onClick={() => setTicketSeleccionado(t)}
                  onKeyPress={(e) => { if (e.key === 'Enter') setTicketSeleccionado(t) }}
                >
                  <div className="barraEstado" style={{ background: meta.color }}></div>
                  <div className="cuerpoTicket">
                    <div className="idTicket monoespaciado">{t.id}</div>
                    <div className="infoTicket">
                      <div className="nombreActivo">{t.activo}</div>
                      <div className="descripcionCorta">{t.falla}</div>
                    </div>
                    <div className="ubicacionTicket">{t.ubicacion}</div>
                    <div className="personasTicket">
                      <b>Reporta:</b> {t.reportadoPor}<br />
                      <b>Técnico:</b> {t.tecnico}
                    </div>
                    <div className="insignia" style={{ background: `${meta.color}22`, color: meta.color }}>
                      <span className="punto" style={{ background: meta.color }}></span>{meta.label}
                    </div>
                    <div className="fechaTicket">{formatDate(t.fecha)}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {resultados.length === 0 && (
            <div className="estadoVacio">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <strong>No se encontraron tickets</strong>
              Ajusta la búsqueda o los filtros para ver más resultados.
            </div>
          )}
        </main>
      </div>

      {/* PANEL DETALLE */}
      <div
        className={`superposicion${ticketSeleccionado ? ' visible' : ''}`}
        onClick={() => setTicketSeleccionado(null)}
      ></div>
      <div className={`panelDetalle${ticketSeleccionado ? ' visible' : ''}`} role="dialog" aria-modal="true">
        <div className="encabezadoPanel">
          <div>
            <h2>{ticketSeleccionado ? ticketSeleccionado.activo : '—'}</h2>
            <div className="subtitulo">
              {ticketSeleccionado ? (
                <><span className="monoespaciado">{ticketSeleccionado.id}</span> · {ticketSeleccionado.tipoActivo}</>
              ) : '—'}
            </div>
          </div>
          <button className="botonCerrar" aria-label="Cerrar detalle" onClick={() => setTicketSeleccionado(null)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {ticketSeleccionado && (
          <div className="cuerpoPanel">
            <div className="estadoPanel">
              <div
                className="insignia"
                style={{ background: `${STATUS_META[ticketSeleccionado.estado].color}22`, color: STATUS_META[ticketSeleccionado.estado].color }}
              >
                <span className="punto" style={{ background: STATUS_META[ticketSeleccionado.estado].color }}></span>
                {STATUS_META[ticketSeleccionado.estado].label}
              </div>
            </div>

            <div className="cuadriculaCampos">
              <div className="campo"><label>Tipo de activo</label><div>{ticketSeleccionado.tipoActivo}</div></div>
              <div className="campo"><label>Marca</label><div>{ticketSeleccionado.marca}</div></div>
              <div className="campo"><label>N.º de serie</label><div>{ticketSeleccionado.serie}</div></div>
              <div className="campo"><label>Tipo de falla</label><div>{ticketSeleccionado.falla}</div></div>
              <div className="campo"><label>Ubicación</label><div>{ticketSeleccionado.ubicacion}</div></div>
              <div className="campo"><label>Fecha de reporte</label><div>{formatDate(ticketSeleccionado.fecha)}</div></div>
              <div className="campo"><label>Reportado por</label><div>{ticketSeleccionado.reportadoPor}</div></div>
              <div className="campo"><label>Técnico asignado</label><div>{ticketSeleccionado.tecnico}</div></div>
            </div>

            <div className="cuadriculaCampos completa">
              <div className="campo"><label>Descripción del daño</label><div>{ticketSeleccionado.descripcion}</div></div>
            </div>

            <div className="tituloSeccion">Historial de estados</div>
            <div className="lineaTiempo">
              {historial.map((h, i) => (
                <div className="itemTiempo" key={i}>
                  <span className="puntoTiempo" style={{ background: h.color }}></span>
                  <div className="textoTiempo">{h.text}<span className="fechaEvento">{h.when}</span></div>
                </div>
              ))}
            </div>

            <Link
              to="/tickets/cambiar-estado"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
                marginTop: '22px',
                background: 'var(--brand)',
                color: '#fff',
                borderRadius: '8px',
                padding: '11px',
                fontSize: '14px',
                fontWeight: 700
              }}
            >
              Cambiar estado
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

export default ConsultarTickets
