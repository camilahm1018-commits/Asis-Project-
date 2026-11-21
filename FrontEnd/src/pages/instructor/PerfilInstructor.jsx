// src/pages/instructor/PerfilInstructor.jsx
// Ruta: /instructor/perfil
import PanelLayout from '../../components/PanelLayout.jsx';
import PerfilUsuario from '../../components/PerfilUsuario.jsx';
import { navItemsInstructor } from './navItems.js';

function PerfilInstructor() {
  return (
    <PanelLayout title="Mi Perfil" rol="instructor" sidebarLabel="Instructor" navItems={navItemsInstructor}>
      <PerfilUsuario rolLabel="Instructor" />
    </PanelLayout>
  );
}

export default PerfilInstructor;
