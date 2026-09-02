import { useState } from 'react'
import Header from '../components/Header.jsx'
import '../styles/Registrarse.css'

const initialForm = {
  tipo_documento_usuario: '',
  numero_de_documento: '',
  nombre_usuario: '',
  apellido_usuario: '',
  telefono_usuario: '',
  correo_usuario: '',
  'contraseña_usuario': '',
  id_rol: ''
}

function Registrarse() {
  const [form, setForm] = useState(initialForm)
  const [mensaje, setMensaje] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje('')

    try {
      const response = await fetch('http://127.0.0.1:8000/registro_2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (response.ok) {
        setMensaje('Usuario registrado correctamente.')
        setForm(initialForm)
      } else {
        setMensaje(data.detail || 'No se pudo completar el registro.')
      }
    } catch (error) {
      setMensaje('No se pudo conectar con el servidor.')
    }
  }

  return (
    <>
      <Header authTo="/login" authLabel="Iniciar sesión" />

      <main className="contentWrapper">
        <div className="formContainer">
          <form className="registroForm" onSubmit={handleSubmit}>
            <h2>Registro de Usuario</h2>

            {mensaje && (
              <p style={{ textAlign: 'center' }}>{mensaje}</p>
            )}

            <div className="formGroupFlex">
              <div className="formField">
                <label htmlFor="tipo_identificacion">Tipo de Documento</label>
                <select
                  id="tipo_identificacion"
                  name="tipo_documento_usuario"
                  required
                  value={form.tipo_documento_usuario}
                  onChange={handleChange}
                >
                  <option value="">Seleccione...</option>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="CE">Cédula de Extranjería</option>
                </select>
              </div>

              <div className="formField">
                <label htmlFor="numero_de_documento">Documento</label>
                <input
                  type="text"
                  id="numero_de_documento"
                  placeholder="Número de documento"
                  name="numero_de_documento"
                  required
                  value={form.numero_de_documento}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="formGroupFlex">
              <div className="formField">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre_usuario"
                  placeholder="Nombre usuario"
                  maxLength={50}
                  required
                  value={form.nombre_usuario}
                  onChange={handleChange}
                />
              </div>

              <div className="formField">
                <label htmlFor="apellido">Apellido</label>
                <input
                  type="text"
                  id="apellido"
                  placeholder="Apellido usuario"
                  name="apellido_usuario"
                  maxLength={50}
                  required
                  value={form.apellido_usuario}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="formGroupFlex">
              <div className="formField">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="text"
                  id="telefono"
                  placeholder="Número de teléfono"
                  name="telefono_usuario"
                  required
                  value={form.telefono_usuario}
                  onChange={handleChange}
                />
              </div>

              <div className="formField">
                <label htmlFor="correo">Correo institucional</label>
                <input
                  type="email"
                  id="correo"
                  placeholder="ejemplo@soy.sena.edu.co"
                  name="correo_usuario"
                  maxLength={50}
                  required
                  value={form.correo_usuario}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="formGroupFlex">
              <div className="formField">
                <label htmlFor="contrasena">Contraseña</label>
                <input
                  type="password"
                  id="contrasena"
                  placeholder="Contraseña"
                  name="contraseña_usuario"
                  maxLength={10}
                  required
                  value={form['contraseña_usuario']}
                  onChange={handleChange}
                />
              </div>

              <div className="formField">
                <label htmlFor="rol">Rol</label>
                <select
                  id="rol"
                  name="id_rol"
                  required
                  value={form.id_rol}
                  onChange={handleChange}
                >
                  <option value="">Seleccione un rol...</option>
                  <option value="1">Administrador</option>
                  <option value="2">Cuentadante</option>
                  <option value="3">Instructor</option>
                  <option value="4">Técnico</option>
                  <option value="5">Jefe Técnico</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn">Guardar</button>
          </form>
        </div>
      </main>
    </>
  )
}

export default Registrarse
