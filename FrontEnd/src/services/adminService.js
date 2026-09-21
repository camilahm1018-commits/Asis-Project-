// src/services/adminService.js
// ==========================================
// SERVICIO DEL PANEL DE ADMINISTRADOR
// ==========================================
// Centraliza las llamadas al backend que usan las páginas de
// /administrador/*. Reutiliza la misma instancia de axios y el
// mismo esquema de manejo de errores que services/api.js.

import api, { getAuthHeaders } from './api';

// ------------------------------------------
// Helper genérico de manejo de errores
// ------------------------------------------
function lanzarError(error, mensajePorDefecto) {
  if (error.response && error.response.data) {
    const mensajeBackend = error.response.data.detail || mensajePorDefecto;
    throw new Error(mensajeBackend);
  }
  throw new Error('No se pudo conectar con el servidor');
}

// ==========================================
// USUARIOS  (backend: prefix "/usuarios")
// ==========================================

export const listarUsuarios = async () => {
  try {
    const { data } = await api.get('/usuarios/', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de usuarios');
  }
};

export const crearUsuario = async (datosUsuario) => {
  try {
    const { data } = await api.post('/usuarios/usuarios', datosUsuario, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo registrar el usuario');
  }
};

export const editarUsuario = async (idUsuario, datosUsuario) => {
  try {
    const { data } = await api.put(`/usuarios/usuarios/${idUsuario}`, datosUsuario, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo editar el usuario');
  }
};

export const eliminarUsuario = async (idUsuario) => {
  try {
    const { data } = await api.delete(`/usuarios/usuarios/${idUsuario}`, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo eliminar el usuario');
  }
};

export const listarTecnicos = async () => {
  try {
    const { data } = await api.get('/usuarios/tecnicos', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de técnicos');
  }
};

// ==========================================
// ROLES  (backend: prefix "/roles")
// ==========================================

export const listarRoles = async () => {
  try {
    const { data } = await api.get('/roles/', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de roles');
  }
};

// ==========================================
// AMBIENTES  (backend: prefix "/ambientes")
// ==========================================

export const listarAmbientes = async () => {
  try {
    const { data } = await api.get('/ambientes/', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de ambientes');
  }
};

export const listarAmbientesDeCuentadante = async (idUsuario) => {
  try {
    if (!idUsuario) {
      throw new Error('ID de usuario no proporcionado');
    }
    
    const { data } = await api.get(`/ambientes/cuentadante/${idUsuario}`, getAuthHeaders());
    return data;
  } catch (error) {
    // Si el endpoint no existe en el backend, usamos el filtro local
    if (error.response?.status === 404) {
      const todos = await listarAmbientes();
      return (todos || []).filter((a) => String(a.id_cuentadante) === String(idUsuario));
    }
    lanzarError(error, 'No se pudo obtener tus ambientes asignados');
  }
};

export const crearAmbiente = async (datosAmbiente) => {
  try {
    const { data } = await api.post('/ambientes/', datosAmbiente, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo registrar el ambiente');
  }
};

export const editarAmbiente = async (idAmbiente, datosAmbiente) => {
  try {
    const { data } = await api.put(`/ambientes/${idAmbiente}`, datosAmbiente, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo editar el ambiente');
  }
};

export const eliminarAmbiente = async (idAmbiente) => {
  try {
    const { data } = await api.delete(`/ambientes/${idAmbiente}`, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo eliminar el ambiente');
  }
};

// ==========================================
// EQUIPOS  (backend: prefix "/equipos")
// ==========================================

export const listarEquipos = async () => {
  try {
    const { data } = await api.get('/equipos/', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de equipos');
  }
};

export const crearEquipo = async (datosEquipo) => {
  try {
    const { data } = await api.post('/equipos/', datosEquipo, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo registrar el equipo');
  }
};

export const editarEquipo = async (idEquipo, datosEquipo) => {
  try {
    const { data } = await api.put(`/equipos/${idEquipo}`, datosEquipo, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo editar el equipo');
  }
};

export const eliminarEquipo = async (idEquipo) => {
  try {
    const { data } = await api.delete(`/equipos/${idEquipo}`, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo eliminar el equipo');
  }
};

// ==========================================
// TIPOS DE EQUIPO  (backend: prefix "/tipo_equipo")
// ==========================================

export const listarTiposEquipo = async () => {
  try {
    const { data } = await api.get('/tipo_equipo/tipos-equipo', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de tipos de equipo');
  }
};

// ==========================================
// TICKETS  (backend: prefix "/tickets")
// ==========================================

export const listarTicketsCrudos = async () => {
  try {
    const { data } = await api.get('/tickets/', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de tickets');
  }
};

// ==========================================
// ESTADOS DE TICKET  (backend: prefix "/estados_ticket")
// ==========================================

export const listarEstadosTicket = async () => {
  try {
    const { data } = await api.get('/estados_ticket/estados_ticket', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de estados de ticket');
  }
};

// ==========================================
// DASHBOARD  (backend: prefix "/dashboard")
// ==========================================
// Estas vistas SQL ya existen en el backend y devuelven los datos
// listos para graficar (ver Backend/enrutadores/dashboard.py).

export const obtenerTicketsPorMes = async () => {
  try {
    const { data } = await api.get('/dashboard/tickets-por-mes', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la actividad mensual');
  }
};

export const obtenerTicketsPorEstado = async () => {
  try {
    const { data } = await api.get('/dashboard/tickets-por-estado', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener los tickets por estado');
  }
};

export const obtenerDanosPorAmbiente = async () => {
  try {
    const { data } = await api.get('/dashboard/danos-por-ambiente', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener los daños por ambiente');
  }
};

export const obtenerTicketsPorTipo = async () => {
  try {
    const { data } = await api.get('/dashboard/tickets-por-tipo', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener los tickets por tipo');
  }
};

export const obtenerHistorialEquipoPorSerial = async (serial) => {
  try {
    const { data } = await api.get(`/dashboard/historial-equipo/${encodeURIComponent(serial)}`, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener el historial de ese equipo');
  }
};

export const crearTicket = async (datosTicket) => {
  try {
    const { data } = await api.post('/tickets/', datosTicket, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo registrar el ticket');
  }
};

export const editarTicket = async (idTicket, datosTicket) => {
  try {
    const { data } = await api.put(`/tickets/${idTicket}`, datosTicket, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo actualizar el ticket');
  }
};

// ==========================================
// MOTIVOS DE NOVEDAD  (backend: prefix "/motivos-novedad")
// ==========================================

export const listarMotivosNovedad = async () => {
  try {
    const { data } = await api.get('/motivos-novedad/', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de motivos de novedad');
  }
};

// ==========================================
// ASIGNACIÓN DE TÉCNICOS  (backend: prefix "/asignacion")
// ==========================================

export const listarAsignaciones = async () => {
  try {
    const { data } = await api.get('/asignacion/', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener la lista de asignaciones');
  }
};

export const asignarTecnico = async (idTicket, idTecnico, asignadoPor) => {
  try {
    const { data } = await api.post('/asignacion/', {
      id_ticket: idTicket,
      id_tecnico: idTecnico,
      asignado_por: asignadoPor,
    }, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo asignar el técnico');
  }
};

// Asignar un técnico también debe reflejarse en tickets.asignado_a
// para que el resto del panel (tablas, dashboard) lo muestre de una vez.
export const asignarTecnicoATicket = async (idTicket, idTecnico, asignadoPor) => {
  await asignarTecnico(idTicket, idTecnico, asignadoPor);
  return editarTicket(idTicket, { asignado_a: idTecnico });
};

// ==========================================
// HISTORIAL DE TICKETS  (backend: prefix "/His_tickets")
// ==========================================

export const listarHistorialTickets = async () => {
  try {
    const { data } = await api.get('/His_tickets/his_tickets', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener el historial de tickets');
  }
};

export const crearHistorialTicket = async (datosHistorial) => {
  try {
    const { data } = await api.post('/His_tickets/his_tickets', datosHistorial, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo registrar el historial del ticket');
  }
};

// Actualiza el ticket (estado / atendido) y deja el registro de
// historial en un solo paso — lo usan Técnico y Mesa de Ayuda al
// cambiar el estado de un ticket.
export const actualizarEstadoTicketConHistorial = async (idTicket, { idEstado, atendido, accion, observacion, estadoResultante, idUsuario }) => {
  // 1. Actualizar el ticket (el backend espera 'id_estado' en snake_case)
  await editarTicket(idTicket, { 
    id_estado: Number(idEstado), 
    atendido: Boolean(atendido) 
  });
  
  // 2. Crear registro en historial (usamos las variables que recibimos como parámetros)
  return crearHistorialTicket({
    id_ticket: Number(idTicket),
    id_usuario: Number(idUsuario),
    accion: String(accion || ''),
    observacion: String(observacion || ''),
    estado_resultante: String(estadoResultante || ''),
  });
};

// ==========================================
// USUARIO ACTUAL (sesión guardada por Login.jsx)
// ==========================================

export const obtenerUsuarioActual = () => {
  const userStr = localStorage.getItem('usuario');
  return userStr ? JSON.parse(userStr) : null;
};

const MAPA_COLORES_ESTADO = {
  rojo: '#f87171',
  naranja: '#fb923c',
  amarillo: '#facc15',
  verde: '#4ade80',
  negro: '#6b7280',
  morado: '#a855f7',
  azul: '#45B3BF',
};

export const resolverColorEstado = (nombreColor) =>
  MAPA_COLORES_ESTADO[(nombreColor || '').toLowerCase().trim()] || '#94a3b8';
// ==========================================
// FUNCIÓN COMPUESTA: TICKETS ENRIQUECIDOS
// ==========================================
// El endpoint /tickets/ solo devuelve IDs (id_equipo, creado_por,
// asignado_a, id_estado). Para mostrar nombres en las tablas del
// panel (como en el diseño de Figma) armamos aquí el cruce con
// equipos, usuarios, ambientes y estados. Si tu backend agrega más
// adelante un endpoint que ya devuelva esto "unido", reemplaza el
// contenido de esta función por una sola llamada a ese endpoint.

export const listarTicketsAdministrador = async () => {
  const [tickets, equipos, usuarios, ambientes, estados] = await Promise.all([
    listarTicketsCrudos(),
    listarEquipos(),
    listarUsuarios(),
    listarAmbientes(),
    listarEstadosTicket(),
  ]);

  const mapaEquipos = Object.fromEntries((equipos || []).map((e) => [e.id_equipo, e]));
  const mapaUsuarios = Object.fromEntries((usuarios || []).map((u) => [u.id_usuario, u]));
  const mapaAmbientes = Object.fromEntries((ambientes || []).map((a) => [a.id_ambiente, a]));
  const mapaEstados = Object.fromEntries((estados || []).map((es) => [es.id_estado, es]));

  return (tickets || []).map((t) => {
    const equipo = mapaEquipos[t.id_equipo];
    const ambiente = equipo ? mapaAmbientes[equipo.id_ambiente] : null;
    const creadoPor = mapaUsuarios[t.creado_por];
    const asignadoA = t.asignado_a ? mapaUsuarios[t.asignado_a] : null;
    const estado = mapaEstados[t.id_estado];

    return {
      id: t.id_ticket,
      titulo: t.motivo,
      equipo: equipo ? equipo.nombre : `Equipo #${t.id_equipo}`,
      idEquipo: t.id_equipo,
      ambiente: ambiente ? ambiente.nombre_a : 'Sin ambiente',
      idTipoEquipo: equipo ? equipo.id_tipo : null,
      creadoPor: creadoPor ? `${creadoPor.nombre_u} ${creadoPor.apellidos_u}` : 'Desconocido',
      idCreadoPor: t.creado_por, // ⚠️ ESTA ES LA LÍNEA CLAVE QUE FALTABA
      tecnico: asignadoA ? `${asignadoA.nombre_u} ${asignadoA.apellidos_u}` : 'Sin asignar',
      idTecnico: t.asignado_a,
      estado: estado ? estado.nombre_e : 'Sin estado',
      idEstado: t.id_estado,
      estadoColor: resolverColorEstado(estado?.color),
      tipoSalida: t.tipo_salida,
      fecha: t.creado_en,
      fechaSalida: t.fecha_salida,
      fechaRetorno: t.fecha_retorno,
      atendido: t.atendido,
    };
  });
};
// ==========================================
// AMBIENTES Y EQUIPOS FILTRADOS (RF-006)
// ==========================================

export const listarMisAmbientes = async () => {
  try {
    const { data } = await api.get('/ambientes/mis-ambientes', getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener tus ambientes asignados');
  }
};

export const listarEquiposPorAmbiente = async (idAmbiente) => {
  try {
    const { data } = await api.get(`/equipos/?id_ambiente=${idAmbiente}`, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener los equipos de este ambiente');
  }
};

// ==========================================
// RECUPERACIÓN DE CONTRASEÑA (RF-018)
// ==========================================

export async function solicitarRecuperacion(correo) {
  try {
    const res = await fetch('http://127.0.0.1:8000/auth/solicitar-recuperacion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ correo })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al solicitar la recuperación');
    }
    
    return await res.json();
  } catch (error) {
    lanzarError(error, 'No se pudo solicitar la recuperación de contraseña');
  }
}

export async function restablecerContrasena(token, nueva_contrasena) {
  try {
    const res = await fetch('http://127.0.0.1:8000/auth/restablecer-contrasena', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, nueva_contrasena })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al restablecer la contraseña');
    }
    
    return await res.json();
  } catch (error) {
    lanzarError(error, 'No se pudo restablecer la contraseña');
  }
}

// ==========================================
// PRE-REGISTRO DE USUARIOS (RF-016)
// ==========================================

export const preRegistrarUsuario = async (datosUsuario) => {
  try {
    const { data } = await api.post('/usuarios/pre-registrar', datosUsuario, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo pre-registrar el usuario');
  }
};

// ==========================================
// HISTORIAL DE UN TICKET ESPECÍFICO
// ==========================================
export const obtenerHistorialDeTicket = async (idTicket) => {
  try {
    // Nota: Ajusta la URL si tu backend usa otra ruta (ej: /tickets/${idTicket}/historial)
    const { data } = await api.get(`/His_tickets/his_tickets/${idTicket}`, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo obtener el historial de este ticket');
  }
};

// ==========================================
// REGISTRAR ENTRADA DE EQUIPO (RF-007 / RF-010)
// ==========================================
export const registrarEntradaEquipo = async (idTicket, datos) => {
  try {
    // Nota: Ajusta la URL si tu backend usa una ruta ligeramente diferente 
    // (por ejemplo: /tickets/${idTicket}/entrada o similar)
    const { data } = await api.put(`/tickets/${idTicket}/registrar-entrada`, datos, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo registrar la entrada del equipo');
  }
};

// ==========================================
// REASIGNAR TÉCNICO A TICKET
// ==========================================
export const reasignarTecnico = async (idTicket, idTecnico, idAsignadoPor) => {
  try {
    const { data } = await api.put(`/tickets/${idTicket}/reasignar`, {
      id_tecnico: idTecnico,
      asignado_por: idAsignadoPor,
    }, getAuthHeaders());
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo reasignar el técnico');
  }
};
// ==========================================
// DESASIGNAR TÉCNICO (Devolver a la cola)
// ==========================================
export const desasignarTecnico = async (idTicket) => {
  try {
    // Enviamos 'null' explícitamente para borrar la asignación
    const { data } = await api.put(
      `/tickets/${idTicket}`, 
      { asignado_a: null }, 
      getAuthHeaders()
    );
    return data;
  } catch (error) {
    lanzarError(error, 'No se pudo desasignar el técnico del ticket');
  }
};

// ==========================================
// NOTIFICACIONES (RF-010)
// ==========================================
export const crearNotificacion = async (datosNotificacion) => {
  try {
    // ✅ URL correcta: prefix "/notificaciones" + ruta "/notificaciones" = "/notificaciones/notificaciones"
    const { data } = await api.post('/notificaciones/notificaciones', datosNotificacion, getAuthHeaders());
    return data;
  } catch (error) {
    console.error("Error al crear notificación:", error.response?.data);
    lanzarError(error, 'No se pudo crear la notificación');
  }
};