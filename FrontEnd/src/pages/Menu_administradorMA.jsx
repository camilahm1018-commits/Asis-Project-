// src/pages/Menu_administradorMA.jsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'

// 🔄 Si renombraste el CSS, actualiza el import
import '../styles/Menu_administrador_MA.css'  // ← Ajusta según el nombre que le diste

function AdminMesaAyuda() {  // ← Cambia el nombre de la función
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('usuario')
    if (!userStr) {
      navigate('/login')
      return
    }
    
    const userData = JSON.parse(userStr)
    if (userData.rol?.toLowerCase() !== 'administrador_mesa_ayuda') {
      alert('No tienes permisos para acceder a esta sección')
      navigate('/login')
      return
    }
    setUsuario(userData)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  if (!usuario) return null

  return (
    <>
      <Header authTo="/perfil" authLabel={usuario.nombre} />
      <div className="adminContainer">
        <div className="adminHeader">
          <h1>Administrador Mesa de Ayuda</h1>
          <p>Bienvenido, {usuario.nombre} {usuario.apellidos}</p>
        </div>

        <div className="adminGrid">
          <Link to="/tickets/consultar" className="adminCard">
            <div className="adminCardIcon">🎫</div>
            <h3>Tickets</h3>
            <p>Gestionar todos los tickets</p>
          </Link>
          <Link to="/mesa-ayuda/asignar" className="adminCard">
            <div className="adminCardIcon">👨‍💻</div>
            <h3>Asignar Técnicos</h3>
            <p>Asignar tickets a técnicos</p>
          </Link>
          <Link to="/ambientes" className="adminCard">
            <div className="adminCardIcon">🏢</div>
            <h3>Ambientes</h3>
            <p>Gestionar ambientes</p>
          </Link>
          <Link to="/mesa-ayuda/equipos" className="adminCard">
            <div className="adminCardIcon">💻</div>
            <h3>Equipos</h3>
            <p>Gestionar equipos</p>
          </Link>
          <Link to="/mesa-ayuda/reportes" className="adminCard">
            <div className="adminCardIcon">📊</div>
            <h3>Reportes</h3>
            <p>Estadísticas de la mesa de ayuda</p>
          </Link>
        </div>

        <button onClick={handleLogout} className="btnLogout">
          Cerrar Sesión
        </button>
      </div>
    </>
  )
}


export default MenuAdministradorMA