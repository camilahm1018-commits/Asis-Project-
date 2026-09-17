// src/pages/cuentadante/RegistrarSalidaCuentadante.jsx
// Ruta: /cuentadante/salida
import { useEffect, useState } from 'react'
import PanelLayout from '../../components/PanelLayout.jsx'
import SalidaEquipoForm from '../../components/SalidaEquipoForm.jsx'
import { navItemsCuentadante } from './navItems.js'
import { listarAmbientesDeCuentadante, obtenerUsuarioActual } from '../../services/adminService.js'

function RegistrarSalidaCuentadante() {
  const [idsAmbientes, setIdsAmbientes] = useState(null)

  useEffect(() => {
    async function cargar() {
      const usuarioActual = obtenerUsuarioActual()
      const misAmbientes = await listarAmbientesDeCuentadante(usuarioActual?.id_usuario)
      setIdsAmbientes((misAmbientes || []).map((a) => a.id_ambiente))
    }
    cargar()
  }, [])

  return (
    <PanelLayout title="Registrar Salida" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Registrar Salida de Equipo</h1>
          <p className="pa-section-header__subtitle">De los ambientes que tienes a cargo</p>
        </div>
      </div>
      {idsAmbientes === null ? (
        <p className="pa-loading">Cargando...</p>
      ) : (
        <SalidaEquipoForm ambientesPermitidos={null} />
      )}
    </PanelLayout>
  )
}

export default RegistrarSalidaCuentadante
