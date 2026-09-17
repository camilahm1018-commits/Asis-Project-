import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Contactanos.css';

const Contactanos = () => {
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría tu lógica para enviar el formulario a la API
    setEnviado(true);
    
    // Opcional: Resetear el formulario después de 3 segundos
    setTimeout(() => setEnviado(false), 3000);
  };

  return (
    <div className="contacto-page">
      {/* Botón de volver */}
      <Link to="/" className="btn-volver-arriba">
        Volver
      </Link>

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

        <form className="formulario-contacto" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre" className="form-label">Nombre completo</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input 
                type="text" 
                id="nombre" 
                placeholder="Ej: Juan Pérez" 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="correo" className="form-label">Correo electrónico</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input 
                type="email" 
                id="correo" 
                placeholder="ejemplo@correo.com" 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mensaje" className="form-label">Tu mensaje</label>
            <div className="input-wrapper">
              <span className="input-icon textarea-icon">💬</span>
              <textarea 
                id="mensaje" 
                placeholder="Escribe aquí tu duda o sugerencia..." 
                required
              ></textarea>
            </div>
          </div>

          <button type="submit" className="btn-enviar">
            Enviar Mensaje
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contactanos;