// src/pages/Administrador/PerfilAdministrador.jsx
// Ruta: /administrador/perfil
import AdminLayout from '../../components/AdminLayout.jsx';
import PerfilUsuario from '../../components/PerfilUsuario.jsx';

function PerfilAdministrador() {
  return (
    <AdminLayout title="Mi Perfil">
      <PerfilUsuario rolLabel="Administrador" />
    </AdminLayout>
  );
}

export default PerfilAdministrador;
