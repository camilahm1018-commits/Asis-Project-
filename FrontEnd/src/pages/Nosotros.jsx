import React from 'react';
import { Link } from 'react-router-dom'; // ✅ 1. Importamos Link
import '../styles/Nosotros.css'; 

const Nosotros = () => {
  // ==========================================
  // 📝 DATOS DEL EQUIPO ASIS
  // ==========================================
  const datosDelEquipo = [
    {
      id: 1,
      nombre: "Stephany Hernandez",
      rol: "Líder y Desarrolladora Frontend",
      descripcion: "Coordina el equipo, gestiona las actividades por medio de la metodologia Kanban, define prioridades y asegura que el proyecto cumpla con los requisitos del cliente.",
      foto: "/IMG/Camila.jpeg" 
    },
    {
      id: 2,
      nombre: "Janer Rivas",
      rol: "Líder de Backend",
      descripcion: "Desarrolla los endpoints de la API en FastAPI, gestiona la lógica del servidor y garantiza la integración entre el frontend y la base de datos.",
      foto: "/IMG/Janer.jpeg" 
    },
    {
      id: 3,
      nombre: "Alejandro Fuentes",
      rol: "Analista QA y Diseño",
      descripcion: "Prueba los endpoints y funcionalidades del sistema y verifica que los criterios de aceptación se cumplan.",
      foto: "/IMG/Alejandro.jpeg"
    },
    {
      id: 4,
      nombre: "Esteban Castrillon",
      rol: "Líder Base de Datos",
      descripcion: "Diseña y administra la base de datos en PostgreSQL, gestiona las tablas, vistas y relaciones del sistema.",
      foto: "/IMG/Esteban.jpeg" 
    }
  ];

  return (
    <section className="asis-nosotros-seccion">
      <div className="asis-contenedor">

        {/* ✅ 2. Botón de volver agregado aquí */}
        <Link to="/" className="btn-volver-nosotros">
          Volver
        </Link>

        {/* 1. SECCIÓN: ¿QUÉ ES ASIS? */}
        <div className="asis-info-header">
          <div className="asis-badge">Sistema de Gestión de Tickets</div>
          <h2 className="asis-titulo-principal">ASIS</h2>
          <h3>Asistencia Integral SENA</h3>
          <p className="asis-descripcion-proyecto">
            <strong>ASIS</strong> es una solución tecnológica integral desarrollada para optimizar el control, seguimiento y mantenimiento de equipos tecnológicos y mobiliario. 
            <br /><br />
            Fue creado con el objetivo de <strong>digitalizar y agilizar</strong> los procesos de reporte de novedades, asignación de técnicos y gestión de inventario. Buscamos eliminar el envio de correos electronicos, reducir los tiempos de respuesta y garantizar una trazabilidad completa para instructores, cuentadantes y personal de soporte técnico.
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