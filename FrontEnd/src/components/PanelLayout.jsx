// src/components/PanelLayout.jsx
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import useAutoLogout from '../hooks/useAutoLogout.js';
import { useNotificaciones } from '../hooks/useNotificaciones.js';
import '../styles/panelAdmin.css';

function PanelLayout({ title, rol, sidebarLabel, navItems, children }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const { theme, toggleTheme } = useTheme();

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

  // 👉 USAR EL HOOK DE NOTIFICACIONES
  const { notificaciones, noLeidasCount, marcarComoLeida } = useNotificaciones(usuario?.id_usuario);

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
            
            {/* 🔔 CAMPANITA DE NOTIFICACIONES */}
            <div className="notification-container">
              <button 
                className="notification-bell-btn" 
                onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                title="Ver notificaciones"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                {noLeidasCount > 0 && (
                  <span className="notification-badge">{noLeidasCount > 9 ? '9+' : noLeidasCount}</span>
                )}
              </button>

              {/* MENÚ DESPLEGABLE DE NOTIFICACIONES */}
              {mostrarNotificaciones && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notificaciones</h4>
                    <span className="notification-count">{noLeidasCount} nuevas</span>
                  </div>
                  <div className="notification-list">
                    {notificaciones.length === 0 ? (
                      <p className="no-notifications">No tienes notificaciones</p>
                    ) : (
                      notificaciones.slice(0, 5).map((notif) => ( // Muestra max 5
                        <div 
                          key={notif.id_notificacion} 
                          className={`notification-item ${!notif.enviada ? 'unread' : ''}`}
                          onClick={() => marcarComoLeida(notif.id_notificacion)}
                        >
                          <p className="notif-message">{notif.mensaje}</p>
                          <span className="notif-date">
                            {new Date(notif.fecha_envio).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="pa-avatar pa-avatar--sm">{iniciales || '—'}</span>
            <span className="panel-admin__username">
              {usuario.nombre} {usuario.apellidos}
            </span>
            
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

export default PanelLayout;