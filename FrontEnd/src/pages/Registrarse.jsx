import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import '../styles/Registrarse.css'

// Estado inicial con los nombres EXACTOS de tu modelo UsuarioCrear
const initialForm = {
  id_tipo_identificacion: '',
  numero_documento: '',
  nombre_u: '',
  apellidos_u: '',
  telefono_u: '',
  correo_u: '',
  contrasena_u: '',
  confirmar_contrasena: '', // Solo para validación visual, no se envía
  id_rol: ''
}

function Registrarse() {
  const [form, setForm] = useState(initialForm)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje('')
    setError('')

    // 1. Validar que las contraseñas coincidan
    if (form.contrasena_u !== form.confirmar_contrasena) {
      setError('Las contraseñas no coinciden.')
      return
    }

    // 2. Validar correo SENA (según tu constraint de la BD)
    if (!form.correo_u.endsWith('@sena.edu.co')) {
      setError('El correo debe ser institucional (@sena.edu.co).')
      return
    }

    setCargando(true)

    try {
      // Quitamos 'confirmar_contrasena' para que coincida exactamente con UsuarioCrear
      const { confirmar_contrasena, ...datosParaEnviar } = form

      // ✅ URL CORREGIDA: Apunta a tu endpoint POST /usuarios
      const response = await fetch('http://127.0.0.1:8000/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosParaEnviar)
      })

      const data = await response.json()

      if (response.ok) {
        setMensaje('¡Registro exitoso! Tu cuenta ha sido creada. Redirigiendo al login...')
        setForm(initialForm)
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      } else {
        // Maneja errores como "correo ya existe" o "documento ya existe" que tu backend lanza
        setError(data.detail || 'No se pudo completar el registro. Verifica los datos.')
      }
    } catch (error) {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <Header authTo="/login" authLabel="Iniciar sesión" />

      <main className="contentWrapper">
        <div className="formContainer">
          <form className="registroForm" onSubmit={handleSubmit}>
            <h2>Registro de Usuario ASIS</h2>
            <p className="formSubtitle">Completa tus datos para activar tu cuenta en el sistema.</p>

            {mensaje && <p className="mensajeExito">{mensaje}</p>}
            {error && <p className="mensajeError">{error}</p>}

            {/* Grupo 1: Identificación */}
            <div className="formGroupFlex">
              <div className="formField">
                <label htmlFor="id_tipo_identificacion">Tipo de Documento</label>
                <select
                  id="id_tipo_identificacion"
                  name="id_tipo_identificacion"
                  required
                  value={form.id_tipo_identificacion}
                  onChange={handleChange}
                >
                  <option value="">Seleccione...</option>
                  <option value="1">Cédula de Ciudadanía (CC)</option>
                  <option value="2">Cédula de Extranjería (CE)</option>
                  <option value="3">Tarjeta de Identidad (TI)</option>
                  <option value="4">Registro Civil(RC)</option>
                  <option value="5">Pasaporte (PAS)</option>
                  <option value="6">Número de Identificación Tributaria (NTI)</option>
                  <option value="7">Permiso Especial de Permanencia (PEP)</option>
                  <option value="8">Permiso por Protección Temporal (PPT)</option>
                </select>
              </div>

              <div className="formField">
                <label htmlFor="numero_documento">Número de Documento</label>
                <input
                  type="text"
                  id="numero_documento"
                  name="numero_documento"
                  placeholder="Ej: 1000000000"
                  required
                  value={form.numero_documento}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Grupo 2: Nombres */}
            <div className="formGroupFlex">
              <div className="formField">
                <label htmlFor="nombre_u">Nombres</label>
                <input
                  type="text"
                  id="nombre_u"
                  name="nombre_u"
                  placeholder="Tus nombres"
                  maxLength={50}
                  required
                  value={form.nombre_u}
                  onChange={handleChange}
                />
              </div>

              <div className="formField">
                <label htmlFor="apellidos_u">Apellidos</label>
                <input
                  type="text"
                  id="apellidos_u"
                  name="apellidos_u"
                  placeholder="Tus apellidos"
                  maxLength={100}
                  required
                  value={form.apellidos_u}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Grupo 3: Contacto */}
            <div className="formGroupFlex">
              <div className="formField">
                <label htmlFor="telefono_u">Teléfono</label>
                <input
                  type="tel"
                  id="telefono_u"
                  name="telefono_u"
                  placeholder="Ej: 3001234567"
                  required
                  value={form.telefono_u}
                  onChange={handleChange}
                />
              </div>

              <div className="formField">
                <label htmlFor="correo_u">Correo Institucional</label>
                <input
                  type="email"
                  id="correo_u"
                  name="correo_u"
                  placeholder="nombre.apellido@sena.edu.co"
                  maxLength={100}
                  required
                  value={form.correo_u}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Grupo 4: Seguridad */}
            <div className="formGroupFlex">
              <div className="formField">
                <label htmlFor="contrasena_u">Contraseña</label>
                <input
                  type="password"
                  id="contrasena_u"
                  name="contrasena_u"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                  value={form.contrasena_u}
                  onChange={handleChange}
                />
              </div>

              <div className="formField">
                <label htmlFor="confirmar_contrasena">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="confirmar_contrasena"
                  name="confirmar_contrasena"
                  placeholder="Repite tu contraseña"
                  minLength={6}
                  required
                  value={form.confirmar_contrasena}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Grupo 5: Rol */}
            <div className="formField">
              <label htmlFor="id_rol">Rol en el Sistema</label>
              <select
                id="id_rol"
                name="id_rol"
                required
                value={form.id_rol}
                onChange={handleChange}
              >
                <option value="">Seleccione su rol...</option>
                <option value="1">Instructor</option>
                <option value="2">Técnico</option>
                <option value="3">Administrador</option>
                <option value="4">Cuentadante</option>
                <option value="5">Administrador Mesa de Ayuda</option>
              </select>
            </div>

            <button type="submit" className="btn" disabled={cargando}>
              {cargando ? 'Registrando...' : 'Activar mi Cuenta'}
            </button>

            <p className="formFooter">
              ¿Ya tienes tu cuenta activada? <Link to="/login">Inicia sesión aquí</Link>
            </p>
          </form>
        </div>
      </main>
    </>
  )
}

export default Registrarse