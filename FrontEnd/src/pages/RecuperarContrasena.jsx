// src/pages/RecuperarContrasena.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { solicitarRecuperacion } from '../services/adminService.js'
import '../styles/Recuperar_c.css'

function RecuperarContrasena() {
  const [correo, setCorreo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje('')
    setError('')
    setEnviando(true)

    try {
      const data = await solicitarRecuperacion(correo)
      setMensaje(data.mensaje)
      setCorreo('') // Limpiar el campo tras el envío exitoso
    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Header authTo="/login" authLabel="Iniciar sesión" />

      <div className="container">
        <div id="step-1" className="step">
          <h2>Recuperar Contraseña</h2>
          <p>Ingresa el correo institucional asociado a tu cuenta para recibir las instrucciones.</p>

          <form onSubmit={handleSubmit}>
            <div className="inputContenedor">
              <label htmlFor="correo">Correo Electrónico</label>
              <input
                type="email"
                id="correo"
                placeholder="ejemplo@soy.sena.edu.co"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={enviando}
              />
            </div>

            {mensaje && <p style={{ color: '#45b3bf', textAlign: 'center', marginTop: '10px', fontSize: '14px' }}>{mensaje}</p>}
            {error && <p style={{ color: '#f87171', textAlign: 'center', marginTop: '10px', fontSize: '14px' }}>{error}</p>}

            <button type="submit" className="btnPrincipal" disabled={enviando} style={{ marginTop: '20px' }}>
              {enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
          
          <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
            Cancelar y volver al inicio de sesión
          </Link>
        </div>
      </div>
    </>
  )
}

export default RecuperarContrasena