import { useState } from 'react'
import { Link } from 'react-router-dom'

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
              {/* ✅ ENLACES CORREGIDOS PARA QUE COINCIDAN CON APP.JSX */}
              <li className="mainNavItem">
                <Link to="/nosotros" className="mainNavLink">Nosotros</Link>
              </li>
              <li className="mainNavItem">
                <Link to="/contactanos" className="mainNavLink">Contáctanos</Link>
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