// src/pages/Administrador/RegistrarSalidaAdministrador.jsx
// Ruta: /administrador/salida
import AdminLayout from '../../components/AdminLayout.jsx'
import SalidaEquipoForm from '../../components/SalidaEquipoForm.jsx'

function RegistrarSalidaAdministrador() {
  return (
    <AdminLayout title="Registrar Salida">
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Registrar Salida de Equipo</h1>
          <p className="pa-section-header__subtitle">
            Reporta un daño, traslada un elemento (temporal o definitivo) o registra un préstamo.
          </p>
        </div>
      </div>
      <SalidaEquipoForm ambientesPermitidos={null} />
    </AdminLayout>
  )
}

export default RegistrarSalidaAdministrador