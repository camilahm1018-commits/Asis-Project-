// ============================================
// CONFIGURACIÓN BASE
// ============================================

// URL base de tu backend FastAPI
const API_URL = "http://localhost:8000";

// ============================================
// FUNCIÓN GENÉRICA PARA HACER PETICIONES
// ============================================

/**
 * Función que hace peticiones HTTP al backend
 * @param {string} endpoint - La ruta del endpoint (ej: "/tickets/")
 * @param {string} metodo - El método HTTP (GET, POST, PUT, DELETE)
 * @param {object|null} datos - Los datos a enviar (para POST y PUT)
 * @returns {Promise} - La respuesta del backend
 */
async function peticion(endpoint, metodo = "GET", datos = null) {
  // 1. Configurar las opciones de la petición
  const opciones = {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // 2. Si hay datos (POST, PUT), convertirlos a JSON
  if (datos) {
    opciones.body = JSON.stringify(datos);
  }

  // 3. Si hay un token guardado (después del login), agregarlo
  const token = localStorage.getItem("access_token");
  if (token) {
    opciones.headers["Authorization"] = `Bearer ${token}`;
  }

  // 4. Hacer la petición al backend
  try {
    const respuesta = await fetch(`${API_URL}${endpoint}`, opciones);

    // 5. Verificar si la respuesta fue exitosa
    if (!respuesta.ok) {
      // Si hay error, intentar obtener el mensaje de error del backend
      const errorData = await respuesta.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${respuesta.status}`);
    }

    // 6. Si es DELETE, no hay contenido que devolver
    if (respuesta.status === 204) {
      return null;
    }

    // 7. Devolver los datos como JSON
    return await respuesta.json();
  } catch (error) {
    // 8. Manejar errores de conexión
    console.error("Error en la petición:", error);
    throw error;
  }
}

// ============================================
// FUNCIONES ESPECÍFICAS PARA CADA MÓDULO
// ============================================

// ----- AUTENTICACIÓN -----

export const login = async (correo, contrasena) => {
  // OAuth2 requiere formato de formulario, NO JSON
  const formData = new URLSearchParams();
  formData.append("username", correo); // El backend busca esto en form_data.username
  formData.append("password", contrasena);

  const respuesta = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error en el inicio de sesión");
  }

  return await respuesta.json();
};

export const obtenerMiPerfil = () =>
  peticion("/auth/yo", "GET");

// ----- USUARIOS -----
export const listarUsuarios = () =>
  peticion("/usuarios/", "GET");

export const obtenerUsuario = (id_usuario) =>
  peticion(`/usuarios/usuarios/${id_usuario}`, "GET");

export const crearUsuario = (datos) =>
  peticion("/usuarios/usuarios", "POST", datos);

export const editarUsuario = (id_usuario, datos) =>
  peticion(`/usuarios/usuarios/${id_usuario}`, "PUT", datos);

export const eliminarUsuario = (id_usuario) =>
  peticion(`/usuarios/usuarios/${id_usuario}`, "DELETE");

export const listarTecnicos = () =>
  peticion("/usuarios/tecnicos", "GET");

// ----- TICKETS -----
export const listarTickets = () =>
  peticion("/tickets/", "GET");

export const obtenerTicket = (id) =>
  peticion(`/tickets/${id}`, "GET");

export const crearTicket = (datos) =>
  peticion("/tickets/", "POST", datos);

export const editarTicket = (id, datos) =>
  peticion(`/tickets/${id}`, "PUT", datos);

export const eliminarTicket = (id) =>
  peticion(`/tickets/${id}`, "DELETE");

// ----- ESTADOS DE TICKETS -----
export const listarEstadosTicket = () =>
  peticion("/estados_ticket/estados_ticket", "GET");

export const obtenerEstadoTicket = (id_estado) =>
  peticion(`/estados_ticket/estados_ticket/${id_estado}`, "GET");

export const crearEstadoTicket = (datos) =>
  peticion("/estados_ticket/estados_ticket", "POST", datos);

export const editarEstadoTicket = (id_estado, datos) =>
  peticion(`/estados_ticket/estados_ticket/${id_estado}`, "PUT", datos);

export const eliminarEstadoTicket = (id_estado) =>
  peticion(`/estados_ticket/estados_ticket/${id_estado}`, "DELETE");

// ----- HISTORIAL DE TICKETS -----
export const listarHistorialTickets = () =>
  peticion("/His_tickets/his_tickets", "GET");

export const obtenerHistorialTicket = (id_historial) =>
  peticion(`/His_tickets/his_tickets/${id_historial}`, "GET");

export const crearHistorialTicket = (datos) =>
  peticion("/His_tickets/his_tickets", "POST", datos);

export const editarHistorialTicket = (id_historial, datos) =>
  peticion(`/His_tickets/his_tickets/${id_historial}`, "PUT", datos);

export const eliminarHistorialTicket = (id_historial) =>
  peticion(`/His_tickets/his_tickets/${id_historial}`, "DELETE");

// ----- ASIGNACIÓN TÉCNICO -----
export const listarAsignaciones = () =>
  peticion("/asignacion/", "GET");

export const obtenerAsignacion = (id) =>
  peticion(`/asignacion/${id}`, "GET");

export const asignarTecnico = (datos) =>
  peticion("/asignacion/", "POST", datos);

export const editarAsignacion = (id, datos) =>
  peticion(`/asignacion/${id}`, "PUT", datos);

export const eliminarAsignacion = (id) =>
  peticion(`/asignacion/${id}`, "DELETE");

// ----- ROLES -----
export const listarRoles = () =>
  peticion("/roles/", "GET");

export const obtenerRol = (id) =>
  peticion(`/roles/${id}`, "GET");

export const crearRol = (datos) =>
  peticion("/roles/", "POST", datos);

export const editarRol = (id, datos) =>
  peticion(`/roles/${id}`, "PUT", datos);

export const eliminarRol = (id) =>
  peticion(`/roles/${id}`, "DELETE");

// ----- EQUIPOS -----
export const listarEquipos = () =>
  peticion("/equipos/", "GET");

export const obtenerEquipo = (id_equipo) =>
  peticion(`/equipos/${id_equipo}`, "GET");

export const crearEquipo = (datos) =>
  peticion("/equipos/", "POST", datos);

export const editarEquipo = (id_equipo, datos) =>
  peticion(`/equipos/${id_equipo}`, "PUT", datos);

export const eliminarEquipo = (id_equipo) =>
  peticion(`/equipos/${id_equipo}`, "DELETE");

// ----- AMBIENTES -----
export const listarAmbientes = () =>
  peticion("/ambientes/", "GET");

export const obtenerAmbiente = (id_ambiente) =>
  peticion(`/ambientes/${id_ambiente}`, "GET");

export const crearAmbiente = (datos) =>
  peticion("/ambientes/", "POST", datos);

export const editarAmbiente = (id_ambiente, datos) =>
  peticion(`/ambientes/${id_ambiente}`, "PUT", datos);

export const eliminarAmbiente = (id_ambiente) =>
  peticion(`/ambientes/${id_ambiente}`, "DELETE");

// ----- MOTIVOS NOVEDAD -----
export const listarMotivosNovedad = () =>
  peticion("/motivos-novedad/", "GET");

export const obtenerMotivoNovedad = (id) =>
  peticion(`/motivos-novedad/${id}`, "GET");

export const crearMotivoNovedad = (datos) =>
  peticion("/motivos-novedad/", "POST", datos);

export const editarMotivoNovedad = (id, datos) =>
  peticion(`/motivos-novedad/${id}`, "PUT", datos);

export const eliminarMotivoNovedad = (id) =>
  peticion(`/motivos-novedad/${id}`, "DELETE");

// ----- NOTIFICACIONES -----
export const listarNotificaciones = () =>
  peticion("/notificaciones/notificaciones", "GET");

export const obtenerNotificacion = (id) =>
  peticion(`/notificaciones/notificaciones/${id}`, "GET");

export const crearNotificacion = (datos) =>
  peticion("/notificaciones/notificaciones", "POST", datos);

export const editarNotificacion = (id, datos) =>
  peticion(`/notificaciones/notificaciones/${id}`, "PUT", datos);

export const eliminarNotificacion = (id) =>
  peticion(`/notificaciones/notificaciones/${id}`, "DELETE");

// ----- TIPO DE EQUIPO -----
export const listarTiposEquipo = () =>
  peticion("/tipo_equipo/tipos-equipo", "GET");

export const obtenerTipoEquipo = (id) =>
  peticion(`/tipo_equipo/tipos-equipo/${id}`, "GET");

export const crearTipoEquipo = (datos) =>
  peticion("/tipo_equipo/tipos-equipo", "POST", datos);

export const editarTipoEquipo = (id, datos) =>
  peticion(`/tipo_equipo/tipos-equipo/${id}`, "PUT", datos);

export const eliminarTipoEquipo = (id) =>
  peticion(`/tipo_equipo/tipos-equipo/${id}`, "DELETE");

// ----- TIPO DE IDENTIFICACIÓN -----
export const listarTiposIdentificacion = () =>
  peticion("/Tipo_identificacion/", "GET");

export const obtenerTipoIdentificacion = (id_tipo_id) =>
  peticion(`/Tipo_identificacion/${id_tipo_id}`, "GET");

export const crearTipoIdentificacion = (datos) =>
  peticion("/Tipo_identificacion/", "POST", datos);

export const editarTipoIdentificacion = (id_tipo_id, datos) =>
  peticion(`/Tipo_identificacion/${id_tipo_id}`, "PUT", datos);

export const eliminarTipoIdentificacion = (id_tipo_id) =>
  peticion(`/Tipo_identificacion/${id_tipo_id}`, "DELETE");

// ----- DASHBOARD -----
export const ticketsPorMes = () =>
  peticion("/dashboard/tickets-por-mes", "GET");

export const ticketsPorEstado = () =>
  peticion("/dashboard/tickets-por-estado", "GET");

export const danosPorAmbiente = () =>
  peticion("/dashboard/danos-por-ambiente", "GET");

export const motivosNovedad = () =>
  peticion("/dashboard/motivos-novedad", "GET");

export const ticketsPorTipo = () =>
  peticion("/dashboard/tickets-por-tipo", "GET");

export const historialEquipo = (serial) =>
  peticion(`/dashboard/historial-equipo/${serial}`, "GET");

export const historialUsuario = (id_usuario) =>
  peticion(`/dashboard/historial-usuario/${id_usuario}`, "GET");