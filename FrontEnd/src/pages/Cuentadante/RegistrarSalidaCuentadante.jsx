// src/pages/cuentadante/RegistrarSalidaCuentadante.jsx
// Ruta: /cuentadante/salida
import PanelLayout from '../../components/PanelLayout.jsx'
import SalidaEquipoForm from '../../components/SalidaEquipoForm.jsx'
import { navItemsCuentadante } from './navItems.js'

function RegistrarSalidaCuentadante() {
  return (
    <PanelLayout title="Registrar Salida" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Registrar Salida de Equipo</h1>
          <p className="pa-section-header__subtitle">
            Reporta un daño, traslada un elemento o solicita un préstamo temporal.
          </p>
        </div>
      </div>
      <SalidaEquipoForm ambientesPermitidos={null} />
    </PanelLayout>
  )
}

export default RegistrarSalidaCuentadante