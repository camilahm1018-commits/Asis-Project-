import { Navigate } from 'react-router-dom';

const DESTINOS = {
  administrador: '/administrador',
  administrador_mesa_ayuda: '/mesa-ayuda/panel',
  tecnico: '/tecnico',
  instructor: '/instructor',
  cuentadante: '/cuentadante',
};

export default function ProtectedRoute({ roles, children }) {
  const token = localStorage.getItem('access_token');
  let rol = '';
  try {
    rol = JSON.parse(localStorage.getItem('usuario') || '{}').rol || '';
  } catch {
    return <Navigate to="/login" replace />;
  }
  if (!token || !rol) return <Navigate to="/login" replace />;
  if (!roles.includes(rol)) return <Navigate to={DESTINOS[rol] || '/login'} replace />;
  return children;
}
