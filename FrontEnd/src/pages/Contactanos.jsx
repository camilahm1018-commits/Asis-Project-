import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/Contactanos.css';

const Contactanos = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    categoria: 'Problemas de acceso', // Valor por defecto
    mensaje: ''
  });

  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setEnviado(false);

    try {
      await api.post('/contacto/', formData);
      setEnviado(true);
      setFormData({ nombre: '', correo: '', categoria: 'Problemas de acceso', mensaje: '' });
      setTimeout(() => setEnviado(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar el mensaje.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="contacto-page">
      <Link to="/" className="btn-volver-arriba">Volver</Link>

      <div className="contacto-card">
        <div className="contacto-header">
          <p className="subtitulo">Estamos para ayudarte</p>
          <h1 className="titulo">Contáctanos</h1>
        </div>

        {enviado && (
          <div className="mensaje-exito">
            ¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.
          </div>
        )}

        {error && (
          <div className="mensaje-error" style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        <form className="formulario-contacto" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre" className="form-label">Nombre completo</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input type="text" id="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Juan Pérez" required disabled={cargando} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="correo" className="form-label">Correo electrónico</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input type="email" id="correo" value={formData.correo} onChange={handleChange} placeholder="ejemplo@sena.edu.co" required disabled={cargando} />
            </div>
          </div>

          {/* Menú desplegable con tus clases CSS */}
          <div className="form-group">
            <label htmlFor="categoria" className="form-label">¿En qué te podemos ayudar?</label>
            <div className="input-wrapper">
              <span className="input-icon">📌</span>
              <select id="categoria" value={formData.categoria} onChange={handleChange} required disabled={cargando}>
                <option value="Problemas de acceso">🔑 Problemas de acceso</option>
                <option value="Dudas sobre la aplicación">❓ Dudas sobre la aplicación</option>
                <option value="Reportar un error">🐛 Reportar un error</option>
                <option value="Sugerencias">💡 Sugerencias</option>
                <option value="Otro">📝 Otro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mensaje" className="form-label">Tu mensaje</label>
            <div className="input-wrapper">
              <span className="input-icon textarea-icon">💬</span>
              <textarea id="mensaje" value={formData.mensaje} onChange={handleChange} placeholder="Escribe aquí tu duda o sugerencia..." required disabled={cargando}></textarea>
            </div>
          </div>

          <button type="submit" className="btn-enviar" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contactanos;