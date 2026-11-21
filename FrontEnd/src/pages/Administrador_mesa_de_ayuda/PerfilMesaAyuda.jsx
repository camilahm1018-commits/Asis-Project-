// src/pages/Administrador_mesa_de_ayuda/PerfilMesaAyuda.jsx
// Ruta: /mesa-ayuda/perfil
import PanelLayout from '../../components/PanelLayout.jsx';
import PerfilUsuario from '../../components/PerfilUsuario.jsx';
import { navItemsMesaAyuda } from './navItems.js';

function PerfilMesaAyuda() {
  return (
    <PanelLayout title="Mi Perfil" rol="administrador_mesa_ayuda" sidebarLabel="Administrador Mesa de Ayuda" navItems={navItemsMesaAyuda}>
      <PerfilUsuario rolLabel="Mesa de Ayuda" />
    </PanelLayout>
  );
}

export default PerfilMesaAyuda;
