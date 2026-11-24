// src/components/PanelLayout.jsx
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { useNotificaciones } from '../hooks/useNotificaciones.js';
import '../styles/panelAdmin.css';
import useAutoLogout from '../hooks/useAutoLogout.js';
import { limpiarSesion } from '../services/sesion.js';

const esMovil = () => window.matchMedia('(max-width: 768px)').matches;

function PanelLayout({ title, rol, sidebarLabel, navItems, children }) {
  const navigate = useNavigate();
  useAutoLogout(); 
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

  // Cuando se edita "Mi Perfil" se guarda el usuario y se avisa con este evento,
  // así el nombre y las iniciales de la barra superior cambian sin recargar.
  useEffect(() => {
    const refrescar = () => {
      const userStr = localStorage.getItem('usuario');
      if (userStr) setUsuario(JSON.parse(userStr));
    };
    window.addEventListener('usuario-actualizado', refrescar);
    return () => window.removeEventListener('usuario-actualizado', refrescar);
  }, []);

  const { notificaciones, noLeidasCount, marcarComoLeida } = useNotificaciones(usuario?.id_usuario);

  const handleLogout = () => {
    limpiarSesion();
    navigate('/login', { replace: true });
  };

    const [menuColapsado, setMenuColapsado] = useState(() => {
    if (esMovil()) return true;
    try { return localStorage.getItem('asis_menu_colapsado') === '1'; } catch { return false; }
  });

  // Al pasar de escritorio a móvil, cerrar el panel lateral para que
  // no cubra automáticamente la página. No cambia las rutas ni los roles.
  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const ajustar = (evento) => {
      if (evento.matches) setMenuColapsado(true);
    };
    media.addEventListener('change', ajustar);
    return () => media.removeEventListener('change', ajustar);
  }, []);

  function alternarMenu() {
    const nuevo = !menuColapsado;
    setMenuColapsado(nuevo);
    if (!esMovil()) {
      try { localStorage.setItem('asis_menu_colapsado', nuevo ? '1' : '0'); } catch { /* sin acceso al storage */ }
    }
  }

  if (!usuario) return null;

  const iniciales = `${usuario.nombre?.[0] ?? ''}${usuario.apellidos?.[0] ?? ''}`.toUpperCase();

  return (
    <div className={`panel-admin${menuColapsado ? ' panel-admin--colapsado' : ''}`}>
      {!menuColapsado && <div className="panel-admin__backdrop" onClick={alternarMenu} />}
      <aside className="panel-admin__sidebar" id="menu-lateral">
        <div className="panel-admin__sidebar-title">{sidebarLabel}</div>
        <nav className="panel-admin__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              onClick={() => { if (esMovil()) setMenuColapsado(true); }}
              className={({ isActive }) =>
                `panel-admin__nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="panel-admin__nav-icon material-symbols-rounded">{item.icon}</span>
              <span className="panel-admin__nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="panel-admin__main">
        <header className="panel-admin__topbar">
          <div className="panel-admin__topbar-left">
            <button
              type="button"
              className="panel-admin__menu-toggle"
              onClick={alternarMenu}
              aria-label={menuColapsado ? 'Mostrar menú' : 'Ocultar menú'}
              aria-expanded={!menuColapsado}
              aria-controls="menu-lateral"
            >
              <span className="material-symbols-rounded">{menuColapsado ? 'menu' : 'menu_open'}</span>
            </button>
            <p className="panel-admin__topbar-title">{title}</p>
          </div>
          <div className="panel-admin__topbar-user">
            <div className="notification-container">
              <button 
                className="notification-bell-btn"
                type="button"
                aria-label="Ver notificaciones"
                aria-expanded={mostrarNotificaciones}
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
                      notificaciones.map((notif) => (
                        <button
                          type="button"
                          key={notif.id_notificacion} 
                          className={`notification-item ${!notif.enviada ? 'unread' : ''}`}
                          onClick={() => !notif.enviada && marcarComoLeida(notif.id_notificacion)}
                        >
                          <span className="notif-message">{notif.mensaje}</span>
                          <span className="notif-date">
                            {new Date(notif.fecha_envio).toLocaleString()}
                          </span>
                        </button>
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