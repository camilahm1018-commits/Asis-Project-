import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import '../styles/Recuperar_c.css'

function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje('')

    try {
      const response = await fetch('http://127.0.0.1:8000/recuperar-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setMensaje('Te enviamos un enlace de recuperación a tu correo.')
      } else {
        setMensaje(data.detail || 'No se pudo enviar el enlace de recuperación.')
      }
    } catch (error) {
      setMensaje('No se pudo conectar con el servidor.')
    }
  }

  return (
    <>
      <Header authTo="/login" authLabel="Iniciar sesión" />

      <div className="container">
        <div id="step-1" className="step">
          <h2>Recuperar Contraseña</h2>
          <p>Ingresa el correo electrónico asociado a tu cuenta de instructor/técnico.</p>

          <form onSubmit={handleSubmit}>
            <div className="inputContenedor">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="ejemplo@correo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mensaje && <p>{mensaje}</p>}

            <button type="submit" className="btnPrincipal">
              Enviar enlace de recuperación
            </button>
          </form>
          <Link to="/login">Cancelar</Link>
        </div>
      </div>
    </>
  )
}

export default RecuperarContrasena
