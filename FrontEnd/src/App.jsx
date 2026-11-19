import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Auth
import Login from './pages/Login.jsx'
import Registrarse from './pages/Registrarse.jsx'
import RecuperarContrasena from './pages/RecuperarContrasena.jsx'
import RestablecerContrasena from './pages/RestablecerContrasena.jsx'

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
import PerfilAdministrador from './pages/Administrador/PerfilAdministrador.jsx'

// Mesa de Ayuda
import PanelMesaAyuda from './pages/Administrador_mesa_de_ayuda/PanelMesaAyuda.jsx'
import TicketsMesaAyuda from './pages/Administrador_mesa_de_ayuda/TicketsMesaAyuda.jsx'
import HistorialMesaAyuda from './pages/Administrador_mesa_de_ayuda/HistorialMesaAyuda.jsx'
import AsignarTecnico from './pages/Administrador_mesa_de_ayuda/AsignarTecnico.jsx'
import TecnicosMesaAyuda from './pages/Administrador_mesa_de_ayuda/TecnicosMesaAyuda.jsx'
import ReportesMesaAyuda from './pages/Administrador_mesa_de_ayuda/ReportesMesaAyuda.jsx'
import PerfilMesaAyuda from './pages/Administrador_mesa_de_ayuda/PerfilMesaAyuda.jsx'

// Técnico
import PanelTecnico from './pages/Tecnico/PanelTecnico.jsx'
import TicketsDisponiblesTecnico from './pages/Tecnico/TicketsDisponiblesTecnico.jsx'
import MisTicketsTecnico from './pages/Tecnico/MisTicketsTecnico.jsx'
import HistorialTecnico from './pages/Tecnico/HistorialTecnico.jsx'
import PerfilTecnico from './pages/Tecnico/PerfilTecnico.jsx'

// Instructor
import PanelInstructor from './pages/instructor/PanelInstructor.jsx'
import MisTicketsInstructor from './pages/instructor/MisTicketsInstructor.jsx'
import MisEquiposInstructor from './pages/instructor/MisEquiposInstructor.jsx'
import PerfilInstructor from './pages/instructor/PerfilInstructor.jsx'

// Cuentadante 
import PanelCuentadante from './pages/Cuentadante/PanelCuentadante.jsx'
import InventarioCuentadante from './pages/Cuentadante/InventarioCuentadante.jsx'
import AmbientesCuentadante from './pages/Cuentadante/AmbientesCuentadante.jsx'
import HistorialEquiposCuentadante from './pages/Cuentadante/HistorialEquiposCuentadante.jsx'
import ReportesCuentadante from './pages/Cuentadante/ReportesCuentadante.jsx'
import RegistrarSalidaCuentadante from './pages/Cuentadante/RegistrarSalidaCuentadante.jsx'
import MisTicketsCuentadante from './pages/Cuentadante/MisTicketsCuentadante.jsx'
import PerfilCuentadante from './pages/Cuentadante/PerfilCuentadante.jsx'

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
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />

        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contactanos" element={<Contactanos />} />

        {/* Rutas de Administrador */}
        <Route path="/administrador" element={<ProtectedRoute roles={['administrador']}><PanelAdministrador /></ProtectedRoute>} />
        <Route path="/administrador/usuarios" element={<ProtectedRoute roles={['administrador']}><UsuariosAdministrador /></ProtectedRoute>} />
        <Route path="/administrador/ambientes" element={<ProtectedRoute roles={['administrador']}><AmbientesAdministrador /></ProtectedRoute>} />
        <Route path="/administrador/equipos" element={<ProtectedRoute roles={['administrador']}><EquiposAdministrador /></ProtectedRoute>} />
        <Route path="/administrador/tickets" element={<ProtectedRoute roles={['administrador']}><TicketsAdministrador /></ProtectedRoute>} />
        <Route path="/administrador/reportes" element={<ProtectedRoute roles={['administrador']}><ReportesAdministrador /></ProtectedRoute>} />
        <Route path="/administrador/configuracion" element={<ProtectedRoute roles={['administrador']}><ConfiguracionAdministrador /></ProtectedRoute>} />
        <Route path="/administrador/perfil" element={<ProtectedRoute roles={['administrador']}><PerfilAdministrador /></ProtectedRoute>} />

        {/* Rutas de Mesa de Ayuda */}
        <Route path="/mesa-ayuda/panel" element={<ProtectedRoute roles={['administrador_mesa_ayuda']}><PanelMesaAyuda /></ProtectedRoute>} />
        <Route path="/mesa-ayuda/tickets" element={<ProtectedRoute roles={['administrador_mesa_ayuda']}><TicketsMesaAyuda /></ProtectedRoute>} />
        <Route path="/mesa-ayuda/historial" element={<ProtectedRoute roles={['administrador_mesa_ayuda']}><HistorialMesaAyuda /></ProtectedRoute>} />
        <Route path="/mesa-ayuda/asignar" element={<ProtectedRoute roles={['administrador_mesa_ayuda']}><AsignarTecnico /></ProtectedRoute>} />
        <Route path="/mesa-ayuda/tecnicos" element={<ProtectedRoute roles={['administrador_mesa_ayuda']}><TecnicosMesaAyuda /></ProtectedRoute>} />
        <Route path="/mesa-ayuda/reportes" element={<ProtectedRoute roles={['administrador_mesa_ayuda']}><ReportesMesaAyuda /></ProtectedRoute>} />
        <Route path="/mesa-ayuda/perfil" element={<ProtectedRoute roles={['administrador_mesa_ayuda']}><PerfilMesaAyuda /></ProtectedRoute>} />

        {/* Rutas de Técnico */}
        <Route path="/tecnico" element={<ProtectedRoute roles={['tecnico']}><PanelTecnico /></ProtectedRoute>} />
        <Route path="/tecnico/disponibles" element={<ProtectedRoute roles={['tecnico']}><TicketsDisponiblesTecnico /></ProtectedRoute>} />
        <Route path="/tecnico/tickets" element={<ProtectedRoute roles={['tecnico']}><MisTicketsTecnico /></ProtectedRoute>} />
        <Route path="/tecnico/historial" element={<ProtectedRoute roles={['tecnico']}><HistorialTecnico /></ProtectedRoute>} />
        <Route path="/tecnico/perfil" element={<ProtectedRoute roles={['tecnico']}><PerfilTecnico /></ProtectedRoute>} />

        {/* Rutas de Instructor */}
        <Route path="/instructor" element={<ProtectedRoute roles={['instructor']}><PanelInstructor /></ProtectedRoute>} />
        <Route path="/instructor/reportar" element={<ProtectedRoute roles={['instructor']}><RegistrarTicketSimple /></ProtectedRoute>} />
        <Route path="/instructor/mis-reportes" element={<ProtectedRoute roles={['instructor']}><MisTicketsInstructor /></ProtectedRoute>} />
        <Route path="/instructor/equipos" element={<ProtectedRoute roles={['instructor']}><MisEquiposInstructor /></ProtectedRoute>} />
        <Route path="/instructor/perfil" element={<ProtectedRoute roles={['instructor']}><PerfilInstructor /></ProtectedRoute>} />


        {/* Rutas de Cuentadante */}
        <Route path="/cuentadante" element={<ProtectedRoute roles={['cuentadante']}><PanelCuentadante /></ProtectedRoute>} />
        <Route path="/cuentadante/inventario" element={<ProtectedRoute roles={['cuentadante']}><InventarioCuentadante /></ProtectedRoute>} />
        <Route path="/cuentadante/ambientes" element={<ProtectedRoute roles={['cuentadante']}><AmbientesCuentadante /></ProtectedRoute>} />
        <Route path="/cuentadante/salida" element={<ProtectedRoute roles={['cuentadante']}><RegistrarSalidaCuentadante /></ProtectedRoute>} />
        <Route path="/cuentadante/mis-reportes" element={<ProtectedRoute roles={['cuentadante']}><MisTicketsCuentadante /></ProtectedRoute>} />
        <Route path="/cuentadante/historial" element={<ProtectedRoute roles={['cuentadante']}><HistorialEquiposCuentadante /></ProtectedRoute>} />
        <Route path="/cuentadante/reportes" element={<ProtectedRoute roles={['cuentadante']}><ReportesCuentadante /></ProtectedRoute>} />
        <Route path="/cuentadante/perfil" element={<ProtectedRoute roles={['cuentadante']}><PerfilCuentadante /></ProtectedRoute>} />
        
        {/* Ruta comodín */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App