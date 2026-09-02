import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Header compartido entre las páginas de Login y Registro.
 * Recibe `authLink` (texto y ruta) y `authLabel` para alternar
 * entre "Iniciar sesión" y "Registrarse" según la página.
 */
function Header({ authTo, authLabel }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="mainHeader">
      <div className="mainHeaderContainer">
        <div className="mainHeaderLogo">
          <img src="/IMG/Imagen1.jpg" alt="ASIS" className="logoAsis" />
        </div>

        <button
          className="mainHeaderToggle"
          id="menu-toggle"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <div className="mainHeaderBar"></div>
          <div className="mainHeaderBar"></div>
          <div className="mainHeaderBar"></div>
        </button>

        <nav className={`mainNav${menuOpen ? ' mainNavOpen' : ''}`} id="main-nav">
          <div className="menuOptions">
            <ul className="mainNavList">
              <li className="mainNavItem">
                <Link to="/tickets/consultar" className="mainNavLink">Procesos</Link>
              </li>
              <li className="mainNavItem">
                <Link to="/tickets/registrar" className="mainNavLink">Bienes</Link>
              </li>
              <li className="mainNavItem">
                <Link to="/ambientes" className="mainNavLink">Ambientes</Link>
              </li>
            </ul>
          </div>
          <div className="login">
            <Link to={authTo} className="mainNavLinkSecondary">{authLabel}</Link>
            <img src="/IMG/log.png" alt="" className="logImg" />
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
