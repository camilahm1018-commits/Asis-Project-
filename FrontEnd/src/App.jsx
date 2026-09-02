import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Registrarse from './pages/Registrarse.jsx'
import RecuperarContrasena from './pages/RecuperarContrasena.jsx'
import ConsultarTickets from './pages/ConsultarTickets.jsx'
import RegistrarTicket from './pages/RegistrarTicket.jsx'
import CambioEstadoTicket from './pages/CambioEstadoTicket.jsx'
import ConsultarAmbientes from './pages/ConsultarAmbientes.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registrarse" element={<Registrarse />} />
        <Route path="/recuperar" element={<RecuperarContrasena />} />
        <Route path="/tickets/consultar" element={<ConsultarTickets />} />
        <Route path="/tickets/registrar" element={<RegistrarTicket />} />
        <Route path="/tickets/cambiar-estado" element={<CambioEstadoTicket />} />
        <Route path="/ambientes" element={<ConsultarAmbientes />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
