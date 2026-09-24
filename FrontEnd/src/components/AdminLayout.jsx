// src/components/AdminLayout.jsx
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js'; // ✅ Agregado
import useAutoLogout from '../hooks/useAutoLogout.js';
import '../styles/panelAdmin.css';

const navItems = [
  { to: '/administrador', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/administrador/usuarios', label: 'Usuarios', icon: '👥' },
  { to: '/administrador/ambientes', label: 'Ambientes', icon: '🏫' },
  { to: '/administrador/equipos', label: 'Equipos', icon: '💻' },
  { to: '/administrador/tickets', label: 'Tickets', icon: '🎫' },
  { to: '/administrador/reportes', label: 'Reportes', icon: '📊' },
  { to: '/administrador/configuracion', label: 'Configuración', icon: '⚙️' },
];

function AdminLayout({ title, children }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const { theme, toggleTheme } = useTheme(); // ✅ Agregado
  useAutoLogout();
  
  useEffect(() => {
    const userStr = localStorage.getItem('usuario');
    if (!userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.rol?.toLowerCase().trim() !== 'administrador') {
      alert('No tienes permisos para acceder a esta sección');
      navigate('/login');
      return;
    }
    setUsuario(userData);
  }, [navigate]);

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
        <div className="panel-admin__sidebar-title">Administrador</div>
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
            <span className="pa-avatar pa-avatar--sm">{iniciales || 'AD'}</span>
            <span className="panel-admin__username">
              {usuario.nombre} {usuario.apellidos}
            </span>
            
            {/* ✅ Botón de cambio de tema */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              type="button"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
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

export default AdminLayout;