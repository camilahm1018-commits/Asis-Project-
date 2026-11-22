import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme.js'

function Header({ authTo, authLabel }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

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
                <Link to="/nosotros" className="mainNavLink">Nosotros</Link>
              </li>
              <li className="mainNavItem">
                <Link to="/contactanos" className="mainNavLink">Contáctanos</Link>
              </li>
            </ul>
          </div>
          <div className="login">
            {/* Botón circular de cambio de tema */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-circle"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <Link to={authTo} className="mainNavLinkSecondary">{authLabel}</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header