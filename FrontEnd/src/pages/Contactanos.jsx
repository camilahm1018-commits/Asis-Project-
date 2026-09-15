import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Contactanos.css';

const Contactanos = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    mensaje: ''
  });
  const [mensajeEnviado, setMensajeEnviado] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que el correo sea @sena.edu.co
    if (!formData.correo.endsWith('@sena.edu.co')) {
      alert('Solo se aceptan correos institucionales del SENA (@sena.edu.co)');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMensajeEnviado(true);
        setFormData({ nombre: '', correo: '', mensaje: '' });
        setTimeout(() => setMensajeEnviado(false), 5000);
      } else {
        alert('Error al enviar el mensaje. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al enviar:', error);
      alert('Error de conexión. Verifica que el backend esté corriendo.');
    }
  };

  return (
    <div className="contacto-page">
      {/* Botón de volver arriba a la derecha */}
      <button className="btn-volver-arriba" onClick={() => navigate(-1)} title="Volver">
        Volver
      </button>

      <div className="contacto-card">
        <div className="contacto-header">
          <p className="subtitulo">MENSAJE DE CONTACTO</p>
          <h1 className="titulo">CONTÁCTANOS</h1>
        </div>

        {mensajeEnviado && (
          <div className="mensaje-exito">
            ✅ ¡Mensaje enviado con éxito! Te contactaremos pronto.
          </div>
        )}

        <form onSubmit={handleSubmit} className="formulario-contacto">
          <div className="form-group">
            <label htmlFor="nombre" className="form-label">NOMBRE COMPLETO</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Juan Pérez García"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="correo" className="form-label">CORREO ELECTRÓNICO</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                id="correo"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                required
                placeholder="Ej: juan@email.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mensaje" className="form-label">MENSAJE</label>
            <div className="input-wrapper textarea-wrapper">
              <span className="input-icon textarea-icon">💬</span>
              <textarea
                id="mensaje"
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Escribe tu mensaje aquí..."
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