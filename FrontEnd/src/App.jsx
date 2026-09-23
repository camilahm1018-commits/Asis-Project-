import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Auth
import Login from './pages/Login.jsx'
import Registrarse from './pages/Registrarse.jsx'
import RecuperarContrasena from './pages/RecuperarContrasena.jsx'

// General
import Nosotros from './pages/Nosotros.jsx'
import Contactanos from './pages/Contactanos.jsx'

// Administrador
import PanelAdministrador from './pages/Administrador/PanelAdministrador.jsx'
import UsuariosAdministrador from './pages/Administrador/UsuariosAdministrador.jsx'
import AmbientesAdministrador from './pages/Administrador/AmbientesAdministrador.jsx'
import EquiposAdministrador from './pages/Administrador/EquiposAdministrador.jsx'
import TicketsAdministrador from './pages/Administrador/TicketsAdministrador.jsx'
import ReportesAdministrador from './pages/Administrador/ReportesAdministrador.jsx'
import ConfiguracionAdministrador from './pages/Administrador/ConfiguracionAdministrador.jsx'

// Mesa de Ayuda
import PanelMesaAyuda from './pages/Administrador_mesa_de_ayuda/PanelMesaAyuda.jsx'
import TicketsMesaAyuda from './pages/Administrador_mesa_de_ayuda/TicketsMesaAyuda.jsx'
import HistorialMesaAyuda from './pages/Administrador_mesa_de_ayuda/HistorialMesaAyuda.jsx'
import AsignarTecnico from './pages/Administrador_mesa_de_ayuda/AsignarTecnico.jsx'
import TecnicosMesaAyuda from './pages/Administrador_mesa_de_ayuda/TecnicosMesaAyuda.jsx'
import ReportesMesaAyuda from './pages/Administrador_mesa_de_ayuda/ReportesMesaAyuda.jsx'

// Técnico
import PanelTecnico from './pages/Tecnico/PanelTecnico.jsx'
import MisTicketsTecnico from './pages/Tecnico/MisTicketsTecnico.jsx'
import HistorialTecnico from './pages/Tecnico/HistorialTecnico.jsx'
import PerfilTecnico from './pages/Tecnico/PerfilTecnico.jsx'

// Instructor
import PanelInstructor from './pages/instructor/PanelInstructor.jsx'
import MisTicketsInstructor from './pages/instructor/MisTicketsInstructor.jsx'
import MisEquiposInstructor from './pages/instructor/MisEquiposInstructor.jsx'

// Cuentadante 
import PanelCuentadante from './pages/Cuentadante/PanelCuentadante.jsx'
import InventarioCuentadante from './pages/Cuentadante/InventarioCuentadante.jsx'
import AmbientesCuentadante from './pages/Cuentadante/AmbientesCuentadante.jsx'
import HistorialEquiposCuentadante from './pages/Cuentadante/HistorialEquiposCuentadante.jsx'
import ReportesCuentadante from './pages/Cuentadante/ReportesCuentadante.jsx'
import RegistrarSalidaCuentadante from './pages/Cuentadante/RegistrarSalidaCuentadante.jsx'
import MisTicketsCuentadante from './pages/Cuentadante/MisTicketsCuentadante.jsx'

// ✅ IMPORTACIÓN ÚNICA (Compartida por Instructor y Cuentadante)
import RegistrarTicketSimple from './pages/RegistrarTicketSimple.jsx';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registrarse" element={<Registrarse />} />
        <Route path="/recuperar" element={<RecuperarContrasena />} />

        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contactanos" element={<Contactanos />} />

        {/* Rutas de Administrador */}
        <Route path="/administrador" element={<PanelAdministrador />} />
        <Route path="/administrador/usuarios" element={<UsuariosAdministrador />} />
        <Route path="/administrador/ambientes" element={<AmbientesAdministrador />} />
        <Route path="/administrador/equipos" element={<EquiposAdministrador />} />
        <Route path="/administrador/tickets" element={<TicketsAdministrador />} />
        <Route path="/administrador/reportes" element={<ReportesAdministrador />} />
        <Route path="/administrador/configuracion" element={<ConfiguracionAdministrador />} />

        {/* Rutas de Mesa de Ayuda */}
        <Route path="/mesa-ayuda/panel" element={<PanelMesaAyuda />} />
        <Route path="/mesa-ayuda/tickets" element={<TicketsMesaAyuda />} />
        <Route path="/mesa-ayuda/historial" element={<HistorialMesaAyuda />} />
        <Route path="/mesa-ayuda/asignar" element={<AsignarTecnico />} />
        <Route path="/mesa-ayuda/tecnicos" element={<TecnicosMesaAyuda />} />
        <Route path="/mesa-ayuda/reportes" element={<ReportesMesaAyuda />} />

        {/* Rutas de Técnico */}
        <Route path="/tecnico" element={<PanelTecnico />} />
        <Route path="/tecnico/tickets" element={<MisTicketsTecnico />} />
        <Route path="/tecnico/historial" element={<HistorialTecnico />} />
        <Route path="/tecnico/perfil" element={<PerfilTecnico />} />

        {/* Rutas de Instructor */}
        <Route path="/instructor" element={<PanelInstructor />} />
        <Route path="/instructor/reportar" element={<RegistrarTicketSimple />} />
        <Route path="/instructor/mis-reportes" element={<MisTicketsInstructor />} />
        <Route path="/instructor/equipos" element={<MisEquiposInstructor />} />


        {/* Rutas de Cuentadante */}
        <Route path="/cuentadante" element={<PanelCuentadante />} />
        <Route path="/cuentadante/inventario" element={<InventarioCuentadante />} />
        <Route path="/cuentadante/ambientes" element={<AmbientesCuentadante />} />
        <Route path="/cuentadante/salida" element={<RegistrarSalidaCuentadante />} />
        <Route path="/cuentadante/mis-reportes" element={<MisTicketsCuentadante />} />
        <Route path="/cuentadante/historial" element={<HistorialEquiposCuentadante />} />
        <Route path="/cuentadante/reportes" element={<ReportesCuentadante />} />
        
        {/* Ruta comodín */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App