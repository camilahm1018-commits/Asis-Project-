import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api' // 👉 1. Importamos la función de nuestra API
import Header from '../components/Header.jsx'
import '../styles/login.css'

function Login() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensajeError, setMensajeError] = useState('')
  const [cargando, setCargando] = useState(false) // 👉 2. Estado para deshabilitar el botón mientras carga

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensajeError('')
    setCargando(true)

    try {
      // 👉 3. Usamos nuestra función de api.js en lugar de fetch manual
      const data = await login(correo, contrasena)

      // 👉 4. Guardamos el token y los datos del usuario
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('usuario', JSON.stringify(data))

      // 👉 5. Redirigir según el rol. 
      // OJO: Tu backend devuelve el NOMBRE del rol (texto), no el ID (número).
      // Ajusta estos textos a como se llamen EXACTAMENTE en tu base de datos.
      const rolNombre = data.rol.toLowerCase()

      if (rolNombre.includes('instructor')) {
        navigate('/instructor')
      } else if (rolNombre.includes('tecnico')) {
        navigate('/tecnico')
      } else if (rolNombre.includes('admin') || rolNombre.includes('administrador')) {
        navigate('/admin')
      } else {
        // Si el rol no coincide con ninguno, lo mandamos a una ruta por defecto
        navigate('/') 
      }

    } catch (error) {
      // 👉 6. Si falla, mostramos el error que viene del backend o uno genérico
      setMensajeError(error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <Header authTo="/registrarse" authLabel="Registrarse" />

      <div className="container">
        <div className="infoContainer">
          <h3>INGRESO DE USUARIOS</h3>
        </div>

        <div className="loginContainer">
          <form className="loginForm" id="loginForm" onSubmit={handleSubmit}>
            <h1>INICIAR SESIÓN</h1>

            {mensajeError && (
              <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>
                {mensajeError}
              </p>
            )}

            {/* Campo: Correo */}
            <label htmlFor="correo_usuario">Correo</label>
            <div className="inputContenedor">
              <svg className="inputIcono" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <input
                type="email"
                id="correo_usuario"
                name="correo_usuario"
                placeholder="correo@ejemplo.com"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={cargando} // 👉 Deshabilitar mientras carga
              />
            </div>

            {/* Campo: Contraseña */}
            <label htmlFor="contrasena_usuario">Contraseña</label>
            <div className="inputContenedor">
              <svg className="inputIcono" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <input
                type="password"
                id="contrasena_usuario"
                name="contrasena_usuario"
                placeholder="Contraseña"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                disabled={cargando} // 👉 Deshabilitar mientras carga
              />
            </div>

            <button type="submit" className="btnPrincipal" disabled={cargando}>
              {cargando ? 'Verificando...' : 'Continuar'}
            </button>
          </form>

          <p className="textoSecundario">
            ¿No tienes una cuenta? <Link to="/registrarse">Regístrate</Link>
          </p>
          <p className="textoSecundario">
            <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
          </p>
        </div>
      </div>
    </>
  )
}

export default Login