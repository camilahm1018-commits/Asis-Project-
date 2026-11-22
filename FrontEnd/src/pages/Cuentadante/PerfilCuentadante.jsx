// src/pages/Cuentadante/PerfilCuentadante.jsx
// Ruta: /cuentadante/perfil
import PanelLayout from '../../components/PanelLayout.jsx';
import PerfilUsuario from '../../components/PerfilUsuario.jsx';
import { navItemsCuentadante } from './navItems.js';

function PerfilCuentadante() {
  return (
    <PanelLayout title="Mi Perfil" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      <PerfilUsuario rolLabel="Cuentadante" />
    </PanelLayout>
  );
}

export default PerfilCuentadante;
