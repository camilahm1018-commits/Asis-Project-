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

const estiloAviso = {
  background: 'rgba(69, 179, 191, 0.12)',
  border: '1px solid rgba(69, 179, 191, 0.4)',
  color: '#bfeaf0',
  borderRadius: 8,
  padding: '12px 14px',
  marginBottom: 16,
  fontSize: 13,
  lineHeight: 1.5,
  textAlign: 'center',
};

function Registrarse() {
  const [form, setForm] = useState(initialForm);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviado(false);
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
      await confirmarDatosActivacion(datos);
      setEnviado(true);
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
            {enviado && (
              <div role="status" style={estiloAviso}>
                <p style={{ margin: '0 0 6px' }}>
                  Si tus datos coinciden con un pre-registro pendiente, te enviaremos un correo con el enlace de activación.
                </p>
                <p style={{ margin: 0 }}>
                  Si no llega en unos minutos, revisa la carpeta de spam y que los datos estén escritos igual que en tu pre-registro, o contacta al administrador.
                </p>
              </div>
            )}
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