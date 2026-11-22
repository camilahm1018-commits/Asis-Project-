// src/hooks/useAutoLogout.js
// RF-017: cierra la sesión tras 15 minutos sin actividad del usuario.
// La última actividad se guarda en localStorage, así todas las pestañas
// comparten el contador. Se revisa con un intervalo corto, no con un
// setTimeout largo, para que funcione tras segundo plano o suspensión.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { limpiarSesion, CLAVE_ACTIVIDAD } from '../services/sesion.js'

const MINUTOS_INACTIVIDAD = 15
const EVENTOS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
const INTERVALO_GUARDADO = 5000   // no escribir en cada movimiento del mouse
const INTERVALO_REVISION = 15000  // cada cuánto se comprueba la inactividad

function useAutoLogout() {
  const navigate = useNavigate()

  useEffect(() => {
    const limite = MINUTOS_INACTIVIDAD * 60 * 1000
    let ultimoGuardado = 0

    function marcarActividad() {
      const ahora = Date.now()
      if (ahora - ultimoGuardado < INTERVALO_GUARDADO) return
      ultimoGuardado = ahora
      try { localStorage.setItem(CLAVE_ACTIVIDAD, String(ahora)) } catch { /* sin acceso al storage */ }
    }

    function revisar() {
      let ultima = Date.now()
      try { ultima = Number(localStorage.getItem(CLAVE_ACTIVIDAD)) || ultima } catch { /* idem */ }
      if (Date.now() - ultima >= limite) {
        limpiarSesion()
        navigate('/login', { replace: true, state: { motivo: 'inactividad' } })
      }
    }

    marcarActividad() // entrar a una página protegida cuenta como actividad
    EVENTOS.forEach((e) => window.addEventListener(e, marcarActividad, { passive: true, capture: true }))
    const intervalo = setInterval(revisar, INTERVALO_REVISION)

    return () => {
      EVENTOS.forEach((e) => window.removeEventListener(e, marcarActividad, { capture: true }))
      clearInterval(intervalo)
    }
  }, [navigate])
}

export default useAutoLogout