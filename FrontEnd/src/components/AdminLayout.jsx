import PanelLayout from './PanelLayout.jsx';
import useAutoLogout from '../hooks/useAutoLogout.js';

const navItems = [
  { to: '/administrador', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/administrador/usuarios', label: 'Usuarios', icon: 'group' },
  { to: '/administrador/ambientes', label: 'Ambientes', icon: 'meeting_room' },
  { to: '/administrador/equipos', label: 'Equipos', icon: 'computer' },
  { to: '/administrador/tickets', label: 'Tickets', icon: 'confirmation_number' },
  { to: '/administrador/reportes', label: 'Reportes', icon: 'analytics' },
  { to: '/administrador/configuracion', label: 'Configuración', icon: 'settings' },
  { to: '/administrador/perfil', label: 'Mi Perfil', icon: 'person' },
];

function AdminLayout({ title, children }) {
  useAutoLogout();
  return (
    <PanelLayout title={title} rol="administrador" sidebarLabel="Administrador" navItems={navItems}>
      {children}
    </PanelLayout>
  );
}

export default AdminLayout;
