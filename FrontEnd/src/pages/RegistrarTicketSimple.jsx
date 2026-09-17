// src/pages/RegistrarTicketSimple.jsx
import PanelLayout from '../components/PanelLayout.jsx';
import SalidaEquipoForm from '../components/SalidaEquipoForm.jsx';
import { navItemsInstructor } from './instructor/navItems.js';
import { navItemsCuentadante } from './Cuentadante/navItems.js';
import { obtenerUsuarioActual } from '../services/adminService.js';

function RegistrarTicketSimple() {
  const usuario = obtenerUsuarioActual();
  const rol = usuario?.rol || 'instructor';
  const navItems = rol === 'cuentadante' ? navItemsCuentadante : navItemsInstructor;
  const tituloRol = rol === 'cuentadante' ? 'Cuentadante' : 'Instructor';

  return (
    <PanelLayout title="Registrar Ticket" rol={rol} sidebarLabel={tituloRol} navItems={navItems}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Registrar Salida de Equipo</h1>
          <p className="pa-section-header__subtitle">
            Reporta un daño, traslada un equipo o solicita un préstamo temporal.
          </p>
        </div>
      </div>
      
      {/* ✅ Ambos roles ven TODOS los ambientes (ambientesPermitidos = null) */}
      <SalidaEquipoForm ambientesPermitidos={null} />
      
    </PanelLayout>
  );
}

export default RegistrarTicketSimple;