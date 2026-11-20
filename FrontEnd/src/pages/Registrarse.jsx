import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { confirmarDatosActivacion } from '../services/adminService.js';
import '../styles/Registrarse.css';

const campos = [
  { clave: 'numero_documento', etiqueta: 'Número de documento', maxLength: 20 },
  { clave: 'nombres', etiqueta: 'Nombres', maxLength: 50 },
  { clave: 'apellidos', etiqueta: 'Apellidos', maxLength: 100 },
  { clave: 'correo', etiqueta: 'Correo registrado', maxLength: 100, tipo: 'email' },
];
const initialForm = { numero_documento: '', nombres: '', apellidos: '', correo: '' };

function Registrarse() {
  const [form, setForm] = useState(initialForm);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje('');
    setError('');
    const datos = Object.fromEntries(
      Object.entries(form).map(([campo, valor]) => [campo, valor.trim()])
    );
    if (Object.values(datos).some((valor) => !valor)) {
      setError('Completa los cuatro datos de tu pre-registro.');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await confirmarDatosActivacion(datos);
      setMensaje(respuesta.mensaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <Header authTo="/login" authLabel="Iniciar sesión" />
      <main className="contentWrapper">
        <div className="formContainer">
          <form className="registroForm" onSubmit={handleSubmit}>
            <h2>Activar cuenta ASIS</h2>
            <p className="formSubtitle">Ingresa los datos con los que el administrador pre-registró tu cuenta.</p>
            {mensaje && <p className="mensajeExito" role="status">{mensaje}</p>}
            {error && <p className="mensajeError" role="alert">{error}</p>}
            {campos.map(({ clave, etiqueta, maxLength, tipo = 'text' }) => (
              <div className="formField" key={clave}>
                <label htmlFor={clave}>{etiqueta} *</label>
                <input id={clave} name={clave} type={tipo} value={form[clave]} maxLength={maxLength} onChange={handleChange} required />
              </div>
            ))}
            <button type="submit" className="btn" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Solicitar enlace de activación'}
            </button>
            <p className="formFooter">
              ¿Ya activaste tu cuenta? <Link to="/login">Inicia sesión aquí</Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}

export default Registrarse;
