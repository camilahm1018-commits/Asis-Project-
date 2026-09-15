// src/hooks/useAutoLogout.js
//
// Lo uso en los layouts de cada rol para que, si alguien deja la
// sesión abierta y no toca nada, ASIS lo saque solo por seguridad
// (RF-017). Reinicio el contador con cualquier click, tecla o
// movimiento del mouse.
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const MINUTOS_INACTIVIDAD = 15

function useAutoLogout() {
  const navigate = useNavigate()
  const temporizador = useRef(null)

  useEffect(() => {
    function cerrarSesion() {
      localStorage.removeItem('access_token')
      localStorage.removeItem('usuario')
      navigate('/login')
    }

    function reiniciarTemporizador() {
      if (temporizador.current) clearTimeout(temporizador.current)
      temporizador.current = setTimeout(cerrarSesion, MINUTOS_INACTIVIDAD * 60 * 1000)
    }

    const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart']
    eventos.forEach((evento) => window.addEventListener(evento, reiniciarTemporizador))

    reiniciarTemporizador()

    return () => {
      if (temporizador.current) clearTimeout(temporizador.current)
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciarTemporizador))
    }
  }, [navigate])
}

export default useAutoLogout
