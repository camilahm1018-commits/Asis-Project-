import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api'
import api from '../services/api'
import Header from '../components/Header.jsx'
import '../styles/login.css'
import { useGoogleLogin } from '@react-oauth/google';

function Login() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensajeError, setMensajeError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    document.body.classList.add('page-login')
    return () => {
      document.body.classList.remove('page-login')
    }
  }, [])

  // 🔵 LOGIN CON GOOGLE (botón manual para evitar el error 403)
  const loginConGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setCargando(true)
      setMensajeError('')
      try {
        // Enviamos el access_token al backend
        const respuesta = await api.post('/auth/google-login', {
          credential: tokenResponse.access_token
        });
        
        // Guardar el token y los datos del usuario
        localStorage.setItem('access_token', respuesta.data.access_token);
        localStorage.setItem('usuario', JSON.stringify(respuesta.data));
        
        // Redirigir según el rol
        const rolNombre = respuesta.data.rol.toLowerCase().trim();
        if (rolNombre === 'administrador_mesa_ayuda') navigate('/mesa-ayuda/panel');
        else if (rolNombre === 'administrador') navigate('/administrador');
        else if (rolNombre === 'cuentadante') navigate('/cuentadante');
        else if (rolNombre === 'instructor') navigate('/instructor');
        else if (rolNombre === 'tecnico') navigate('/tecnico');
        else {
          setMensajeError(`Rol no reconocido: "${respuesta.data.rol}"`);
          navigate('/');
        }
        
      } catch (error) {
        setMensajeError("Error al iniciar sesión con Google: " + (error.response?.data?.detail || error.message));
      } finally {
        setCargando(false)
      }
    },
    onError: (error) => {
      console.log('Error en el login de Google:', error);
      setMensajeError("Error en el login de Google. Intenta de nuevo.");
    },
    flow: 'implicit' // Esto fuerza el popup y evita el iframe problemático
  });

  // 🔵 LOGIN NORMAL CON CORREO Y CONTRASEÑA
  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensajeError('')
    setCargando(true)

    try {
      const data = await login(correo, contrasena)
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('usuario', JSON.stringify(data))

      const rolNombre = data.rol.toLowerCase().trim()
      if (rolNombre === 'administrador_mesa_ayuda') navigate('/mesa-ayuda/panel')
      else if (rolNombre === 'administrador') navigate('/administrador')
      else if (rolNombre === 'cuentadante') navigate('/cuentadante')
      else if (rolNombre === 'instructor') navigate('/instructor')
      else if (rolNombre === 'tecnico') navigate('/tecnico')
      else {
        setMensajeError(`Rol no reconocido: "${data.rol}"`)
        navigate('/')
      }
    } catch (error) {
      setMensajeError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.')
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
              <p className="mensaje-error" style={{ color: '#f87171', textAlign: 'center', marginBottom: '15px', fontSize: '14px' }}>
                {mensajeError}
              </p>
            )}

            <label htmlFor="correo_usuario">Correo</label>
            <div className="inputContenedor">
              <svg className="inputIcono" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <input 
                type="email" 
                id="correo_usuario" 
                name="correo_usuario" 
                placeholder="usuario@sena.edu.co" 
                required 
                value={correo} 
                onChange={(e) => setCorreo(e.target.value)} 
                disabled={cargando} 
              />
            </div>

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
                disabled={cargando} 
              />
            </div>

            <button type="submit" className="btnPrincipal" disabled={cargando}>
              {cargando ? 'Verificando...' : 'Continuar'}
            </button>

            {/* 🔵 BOTÓN MANUAL DE GOOGLE (evita el error 403 del iframe) */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <button 
                type="button"
                onClick={loginConGoogle}
                disabled={cargando}
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  padding: '10px 20px', 
                  border: '1px solid #dadce0', 
                  borderRadius: '4px',
                  backgroundColor: 'white', 
                  color: '#3c4043', 
                  fontWeight: '500',
                  cursor: cargando ? 'not-allowed' : 'pointer', 
                  fontSize: '14px',
                  fontFamily: 'Roboto, Arial, sans-serif'
                }}
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                {cargando ? 'Verificando...' : 'Iniciar sesión con Google'}
              </button>
            </div>
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