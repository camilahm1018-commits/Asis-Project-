import React from 'react';
import '../styles/Nosotros.css'; 

const Nosotros = () => {
  // ==========================================
  // 📝 DATOS DEL EQUIPO ASIS
  // ==========================================
  const datosDelEquipo = [
    {
      id: 1,
      nombre: "Camila Hernandez",
      rol: "Lider y Desarolladora Frontend",
      descripcion: "Especialista en React y diseño de interfaces. Se encarga de que la experiencia del usuario en ASIS sea fluida, intuitiva y moderna.",
      foto: "/IMG/Camila.jpeg" 
    },
    {
      id: 2,
      nombre: "Janer Rivas",
      rol: "Desarrollador Backend",
      descripcion: "Experto en Python, FastAPI y PostgreSQL. Construye la lógica del servidor y garantiza que los datos de tickets y equipos estén seguros.",
      foto: "/IMG/Esteban.jpeg"
    },
    {
      id: 3,
      nombre: "Alejandro Fuentes",
      rol: "Analista QA",
      descripcion: "Creativo detrás de la identidad visual de ASIS. Se asegura de que cada flujo, color y componente tenga sentido para el usuario final.",
      foto: "/IMG/Alejandro.jpeg"
    },
    {
      id: 4,
      nombre: "Esteban Castrillon",
      rol: "Desarrollador Base de datos",
      descripcion: "Lidera la organización, coordina los sprints y asegura que el sistema cumpla con todos los requisitos de calidad y tiempos de entrega.",
      foto: "/IMG/Janer.jpeg"
    }
  ];

  return (
    <section className="asis-nosotros-seccion">
      <div className="asis-contenedor">

        {/* 1. SECCIÓN: ¿QUÉ ES ASIS? */}
        <div className="asis-info-header">
          <div className="asis-badge">Sistema de Gestión de Tickets</div>
          <h2 className="asis-titulo-principal">ASIS</h2>
          <h3>Asistenacia Integral SENA</h3>
          <p className="asis-descripcion-proyecto">
            <strong>ASIS</strong> es una solución tecnológica integral desarrollada para optimizar el control, seguimiento y mantenimiento de equipos y ambientes tecnológicos. 
            <br /><br />
            Fue creado con el objetivo de <strong>digitalizar y agilizar</strong> los procesos de reporte de novedades, asignación de técnicos y gestión de inventario. Buscamos eliminar el papeleo, reducir los tiempos de respuesta y garantizar una trazabilidad completa para instructores, cuentadantes y personal de soporte técnico.
          </p>
        </div>

        {/* 2. SECCIÓN: EL EQUIPO */}
        <div className="equipo-header">
          <h2 className="equipo-titulo">Nuestro Equipo de Desarrollo</h2>
          <p className="equipo-subtitulo">
            Las mentes creativas y técnicas detrás de ASIS, comprometidas con la innovación y la excelencia.
          </p>
        </div>

        {/* Rejilla de integrantes */}
        <div className="equipo-grid">
          {datosDelEquipo.map((integrante) => (
            <div key={integrante.id} className="tarjeta-integrante">
              <div className="tarjeta-imagen-contenedor">
                <img
                  src={integrante.foto}
                  alt={`Foto de ${integrante.nombre}`}
                  className="tarjeta-imagen"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300/0056b3/ffffff?text=ASIS+Team' }}
                />
              </div>
              <div className="tarjeta-info">
                <h3 className="integrante-nombre">{integrante.nombre}</h3>
                <span className="integrante-rol">{integrante.rol}</span>
                <p className="integrante-descripcion">{integrante.descripcion}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Nosotros;