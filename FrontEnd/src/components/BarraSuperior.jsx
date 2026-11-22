import { Link, useNavigate } from 'react-router-dom'

/**
 * Barra superior compartida entre Consultar tickets, Registrar ticket,
 * Cambio de estado y Consultar ambientes. Antes se repetía en cada HTML.
 */
function BarraSuperior({ subtitulo, rol, iniciales }) {
  const navigate = useNavigate()

  return (
    <div className="barraSuperior">
      <div className="barraSuperiorIzq">
        <button className="volver" type="button" onClick={() => navigate(-1)}>
          &larr; Volver
        </button>
        <img src="/IMG/Imagen1.jpg" alt="Logo ASIS" className="logo" />
        <div className="tituloApp">
          ASIS
          <span>{subtitulo}</span>
        </div>
      </div>

      {/* Navegación entre módulos */}
      <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link to="/tickets/consultar" className="etiquetaRol" style={{ textDecoration: 'none' }}>
          Tickets
        </Link>
        <Link to="/ambientes" className="etiquetaRol" style={{ textDecoration: 'none' }}>
          Ambientes
        </Link>
      </nav>

      <div className="barraSuperiorDer">
        <span className="etiquetaRol">Rol: {rol}</span>
        <div className="avatar">{iniciales}</div>
        <Link to="/login" className="volver" style={{ textDecoration: 'none' }}>
          Salir
        </Link>
      </div>
    </div>
  )
}

export default BarraSuperior
