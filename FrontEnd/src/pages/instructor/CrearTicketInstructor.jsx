// src/pages/instructor/CrearTicketInstructor.jsx
// Ruta: /instructor/reportar
import PanelLayout from '../../components/PanelLayout.jsx';
import SalidaEquipoForm from '../../components/SalidaEquipoForm.jsx';
import { navItemsInstructor } from './navItems.js';

function CrearTicketInstructor() {
  return (
    <PanelLayout title="Reportar Falla" rol="instructor" sidebarLabel="Instructor" navItems={navItemsInstructor}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Reportar Falla o Novedad</h1>
          <p className="pa-section-header__subtitle">
            Reporta un daño, traslada un equipo o solicita un préstamo temporal.
          </p>
        </div>
      </div>
      
      {/* Reutilizamos el componente robusto que ya creamos para el RF-006 */}
      <SalidaEquipoForm />
      
    </PanelLayout>
  );
}

export default CrearTicketInstructor;