// src/components/PanelLayout.jsx
// ==========================================
// LAYOUT GENÉRICO DE PANEL (Mesa de Ayuda / Técnico / Instructor / Cuentadante)
// ==========================================
// Mismo look & feel que AdminLayout.jsx (sidebar + topbar oscuros del
// diseño de Figma) pero reutilizable para cualquier rol: recibe el
// rol esperado, el título de la barra lateral y sus ítems de
// navegación como props. Componente NUEVO — no toca Header.jsx,
// BarraSuperior.jsx ni AdminLayout.jsx.

import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAutoLogout from '../hooks/useAutoLogout.js';
import '../styles/panelAdmin.css';

function PanelLayout({ title, rol, sidebarLabel, navItems, children }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('usuario');
    if (!userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.rol?.toLowerCase().trim() !== rol) {
      alert('No tienes permisos para acceder a esta sección');
      navigate('/login');
      return;
    }
    setUsuario(userData);
  }, [navigate, rol]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (!usuario) return null;

  const iniciales = `${usuario.nombre?.[0] ?? ''}${usuario.apellidos?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="panel-admin">
      <aside className="panel-admin__sidebar">
        <div className="panel-admin__sidebar-title">{sidebarLabel}</div>
        <nav className="panel-admin__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `panel-admin__nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="panel-admin__nav-icon">{item.icon}</span>
              <span className="panel-admin__nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="panel-admin__main">
        <header className="panel-admin__topbar">
          <p className="panel-admin__topbar-title">{title}</p>
          <div className="panel-admin__topbar-user">
            <span className="pa-avatar pa-avatar--sm">{iniciales || '—'}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {usuario.nombre} {usuario.apellidos}
            </span>
            <button className="panel-admin__logout" onClick={handleLogout} type="button">
              Salir
            </button>
          </div>
        </header>
        <div className="panel-admin__content">{children}</div>
      </main>
    </div>
  );
}

export default PanelLayout;
