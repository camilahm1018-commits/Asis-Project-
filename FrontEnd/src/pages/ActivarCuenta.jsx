// src/pages/ActivarCuenta.jsx
// Ruta pública: /activar-cuenta?token=...
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { activarCuenta } from '../services/adminService.js'
import '../styles/Recuperar_c.css'

function ActivarCuenta() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [contrasena, setContrasena] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Este link no trae un token válido. Pide que te reenvíen el correo de activación.')
      return
    }

    if (contrasena !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setEnviando(true)
    try {
      await activarCuenta(token, contrasena)
      setListo(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Header authTo="/login" authLabel="Iniciar sesión" />

      <div className="container">
        <div className="step">
          {listo ? (
            <>
              <div className="successIcon">✓</div>
              <h2>Cuenta activada</h2>
              <p>Ya puedes iniciar sesión con tu correo y tu nueva contraseña. Te llevamos al login...</p>
            </>
          ) : (
            <>
              <h2>Crea tu contraseña</h2>
              <p>Esta es la última vez que necesitas este link. Una vez actives tu cuenta, inicia sesión con tu correo institucional.</p>

              <form onSubmit={handleSubmit}>
                <div className="inputContenedor">
                  <label htmlFor="contrasena">Nueva contraseña</label>
                  <input
                    type="password"
                    id="contrasena"
                    required
                    minLength={6}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                  />
                </div>

                <div className="inputContenedor">
                  <label htmlFor="confirmar">Confirmar contraseña</label>
                  <input
                    type="password"
                    id="confirmar"
                    required
                    minLength={6}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                  />
                </div>

                {error && <p style={{ color: '#f87171' }}>{error}</p>}

                <button type="submit" className="btnPrincipal" disabled={enviando}>
                  {enviando ? 'Activando...' : 'Activar cuenta'}
                </button>
              </form>
              <Link to="/login">Cancelar</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ActivarCuenta
