// src/utils/reportes/calculos.js
// ==========================================================
// CÁLCULO DE LOS REPORTES (RF-014)
// ==========================================================
// Funciones puras: reciben los datos que la página ya carga y los
// filtros elegidos, y devuelven reportes con una forma única:
//   { id, titulo, descripcion, columnas: [..], filas: [[..], ..], nota? }
// Los exportadores (PDF / Excel) y la vista previa leen esa misma forma,
// así que agregar un reporte nuevo solo exige agregarlo a CATALOGO_REPORTES.

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ESTADOS_FINALES = ['entregado en ambiente', 'reparado', 'dado de baja', 'trasladado'];

const ETIQUETA_SALIDA = {
  dano: 'Daño',
  traslado: 'Traslado',
  prestamo: 'Préstamo',
};

// ------------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------------
const mayusInicial = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function aFecha(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatearFecha(valor) {
  const d = valor instanceof Date ? valor : aFecha(valor);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function formatearDuracion(horas) {
  if (horas === null || horas === undefined || Number.isNaN(horas)) return 'Sin datos';
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 48) return `${horas.toFixed(1)} h`;
  return `${(horas / 24).toFixed(1)} días`;
}

const promedio = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

function contar(items, claveFn) {
  const mapa = new Map();
  items.forEach((it) => {
    const k = claveFn(it);
    mapa.set(k, (mapa.get(k) || 0) + 1);
  });
  return mapa;
}

const ordenarPorTotalDesc = (entradas) =>
  [...entradas].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'es'));

// ------------------------------------------------------------------
// 1. Filas "enriquecidas": un ticket por fila con todos sus cruces
// ------------------------------------------------------------------
// Tiempo de resolución: el ticket no guarda una fecha de cierre propia,
// así que se toma la última entrada del historial con un estado final
// (Entregado, Reparado, Dado de baja, Trasladado). Si no hay historial,
// se usa fecha_retorno. Solo se calcula para tickets atendidos.
export function construirFilasTickets({
  tickets, equipos, ambientes, usuarios, tiposEquipo, estados, motivos, historial,
}) {
  const mEquipos = Object.fromEntries((equipos || []).map((e) => [e.id_equipo, e]));
  const mAmbientes = Object.fromEntries((ambientes || []).map((a) => [a.id_ambiente, a]));
  const mUsuarios = Object.fromEntries((usuarios || []).map((u) => [u.id_usuario, u]));
  const mTipos = Object.fromEntries((tiposEquipo || []).map((t) => [t.id_tipo, t]));
  const mEstados = Object.fromEntries((estados || []).map((e) => [e.id_estado, e]));
  const mMotivos = Object.fromEntries((motivos || []).map((m) => [m.id_motivo, m]));

  // Última fecha "final" del historial por ticket
  const cierrePorTicket = {};
  (historial || []).forEach((h) => {
    if (!ESTADOS_FINALES.includes(String(h.estado_resultante || '').toLowerCase().trim())) return;
    const f = aFecha(h.fecha);
    if (!f) return;
    const previa = cierrePorTicket[h.id_ticket];
    if (!previa || f > previa) cierrePorTicket[h.id_ticket] = f;
  });

  const nombreUsuario = (u) => (u ? `${u.nombre_u} ${u.apellidos_u}` : '');

  return (tickets || []).map((t) => {
    const equipo = mEquipos[t.id_equipo];
    const ambiente = equipo ? mAmbientes[equipo.id_ambiente] : null;
    const tipo = equipo ? mTipos[equipo.id_tipo] : null;
    const estado = mEstados[t.id_estado];
    const motivoNov = t.id_motivo_novedad ? mMotivos[t.id_motivo_novedad] : null;
    const creado = aFecha(t.creado_en);

    let cierre = null;
    if (t.atendido) cierre = cierrePorTicket[t.id_ticket] || aFecha(t.fecha_retorno);
    const horas = creado && cierre && cierre >= creado ? (cierre - creado) / 36e5 : null;

    return {
      id: t.id_ticket,
      fecha: creado,
      idAmbiente: equipo ? equipo.id_ambiente : null,
      ambiente: ambiente ? ambiente.nombre_a : 'Sin ambiente',
      idTipo: equipo ? equipo.id_tipo : null,
      tipoActivo: tipo ? tipo.nombre_t : 'Sin tipo',
      idEquipo: t.id_equipo,
      equipo: equipo ? equipo.nombre : `Equipo #${t.id_equipo}`,
      codigo: equipo ? equipo.codigo : '',
      serial: equipo ? equipo.serial || '' : '',
      motivo: t.motivo || '',
      tipoSalida: t.tipo_salida ? ETIQUETA_SALIDA[t.tipo_salida] || t.tipo_salida : 'Sin clasificar',
      estado: estado ? estado.nombre_e : 'Sin estado',
      motivoNovedad: motivoNov ? motivoNov.nombre_novedad : null,
      creadoPor: nombreUsuario(mUsuarios[t.creado_por]) || 'Desconocido',
      idTecnico: t.asignado_a || null,
      tecnico: t.asignado_a ? nombreUsuario(mUsuarios[t.asignado_a]) || `Usuario #${t.asignado_a}` : null,
      atendido: Boolean(t.atendido),
      cierre,
      horasResolucion: horas,
    };
  });
}

// ------------------------------------------------------------------
// 2. Filtros
// ------------------------------------------------------------------
// filtros = { desde: 'YYYY-MM-DD' | '', hasta: 'YYYY-MM-DD' | '',
//             idAmbiente: '' | number-like, idTipo: '' | number-like }
export function filtrarTickets(filas, filtros) {
  const desde = filtros.desde ? new Date(`${filtros.desde}T00:00:00`) : null;
  const hasta = filtros.hasta ? new Date(`${filtros.hasta}T23:59:59.999`) : null;
  return filas.filter((f) => {
    if (desde && (!f.fecha || f.fecha < desde)) return false;
    if (hasta && (!f.fecha || f.fecha > hasta)) return false;
    if (filtros.idAmbiente !== '' && String(f.idAmbiente) !== String(filtros.idAmbiente)) return false;
    if (filtros.idTipo !== '' && String(f.idTipo) !== String(filtros.idTipo)) return false;
    return true;
  });
}

export function filtrarEquipos(equipos, filtros) {
  return (equipos || []).filter((e) => {
    if (filtros.idAmbiente !== '' && String(e.id_ambiente) !== String(filtros.idAmbiente)) return false;
    if (filtros.idTipo !== '' && String(e.id_tipo) !== String(filtros.idTipo)) return false;
    return true;
  });
}

// Año al que se limita el reporte mensual (si el rango cae en un solo año)
function anioDelFiltro(filtros) {
  const a = filtros.desde ? Number(filtros.desde.slice(0, 4)) : null;
  const b = filtros.hasta ? Number(filtros.hasta.slice(0, 4)) : null;
  if (a && b && a === b) return a;
  return null;
}

// ------------------------------------------------------------------
// 3. Los 12 reportes
// ------------------------------------------------------------------
function resumenGeneral(tk) {
  const atendidos = tk.filter((t) => t.atendido).length;
  const tasa = tk.length ? (atendidos / tk.length) * 100 : 0;
  const prom = promedio(tk.filter((t) => t.horasResolucion !== null).map((t) => t.horasResolucion));
  return {
    columnas: ['Indicador', 'Valor'],
    filas: [
      ['Total de tickets', tk.length],
      ['Tickets atendidos', atendidos],
      ['Tickets sin atender', tk.length - atendidos],
      ['Tasa de atención', `${tasa.toFixed(1)} %`],
      ['Tiempo promedio de resolución', formatearDuracion(prom)],
    ],
  };
}

function porAmbiente(tk) {
  const filas = ordenarPorTotalDesc(contar(tk, (t) => t.ambiente).entries());
  return { columnas: ['Ambiente', 'Tickets'], filas };
}

function porMes(tk, filtros) {
  const anio = anioDelFiltro(filtros);
  if (anio) {
    const cuenta = new Array(12).fill(0);
    tk.forEach((t) => { if (t.fecha && t.fecha.getFullYear() === anio) cuenta[t.fecha.getMonth()] += 1; });
    return {
      columnas: [`Mes (${anio})`, 'Tickets'],
      filas: MESES.map((m, i) => [m, cuenta[i]]),
    };
  }
  const mapa = contar(tk.filter((t) => t.fecha), (t) => `${t.fecha.getFullYear()}-${String(t.fecha.getMonth() + 1).padStart(2, '0')}`);
  const filas = [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => {
      const [y, m] = k.split('-');
      return [`${MESES[Number(m) - 1]} ${y}`, v];
    });
  return { columnas: ['Mes', 'Tickets'], filas };
}

function porEstado(tk, estadosCatalogo) {
  const mapa = contar(tk, (t) => t.estado);
  // Incluir estados sin tickets para que el reporte siempre muestre el catálogo completo
  (estadosCatalogo || []).forEach((e) => { if (!mapa.has(e.nombre_e)) mapa.set(e.nombre_e, 0); });
  return { columnas: ['Estado', 'Tickets'], filas: ordenarPorTotalDesc(mapa.entries()) };
}

function porTipoActivo(tk) {
  return {
    columnas: ['Tipo de activo', 'Tickets'],
    filas: ordenarPorTotalDesc(contar(tk, (t) => t.tipoActivo).entries()),
  };
}

function salidasPorTipo(tk) {
  const orden = ['Daño', 'Traslado', 'Préstamo', 'Sin clasificar'];
  const mapa = contar(tk, (t) => t.tipoSalida);
  const filas = orden.map((o) => [o, mapa.get(o) || 0]);
  mapa.forEach((v, k) => { if (!orden.includes(k)) filas.push([k, v]); });
  return {
    columnas: ['Tipo de salida', 'Tickets'],
    filas,
    nota: 'Los tickets creados antes de registrar el tipo de salida aparecen como "Sin clasificar".',
  };
}

function motivosNovedad(tk) {
  const conMotivo = tk.filter((t) => t.motivoNovedad);
  const filas = ordenarPorTotalDesc(contar(conMotivo, (t) => t.motivoNovedad).entries());
  return {
    columnas: ['Motivo de novedad', 'Tickets'],
    filas,
    nota: filas.length === 0
      ? 'Aún no hay tickets con motivo de novedad. Se registra al cerrar un ticket como "Dado de baja".'
      : undefined,
  };
}

function rendimientoTecnico(tk, usuarios, roles) {
  const rolTecnico = (roles || []).find((r) => String(r.nombre_rol).toLowerCase().trim() === 'tecnico');
  const tecnicos = (usuarios || []).filter((u) => rolTecnico && u.id_rol === rolTecnico.id_rol);
  const asignados = tk.filter((t) => t.idTecnico);

  const filas = tecnicos.map((u) => {
    const suyos = asignados.filter((t) => t.idTecnico === u.id_usuario);
    const resueltos = suyos.filter((t) => t.atendido);
    const prom = promedio(resueltos.filter((t) => t.horasResolucion !== null).map((t) => t.horasResolucion));
    return [
      `${u.nombre_u} ${u.apellidos_u}`,
      suyos.length,
      resueltos.length,
      suyos.length - resueltos.length,
      formatearDuracion(prom),
    ];
  });
  filas.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
  return {
    columnas: ['Técnico', 'Asignados', 'Resueltos', 'Pendientes', 'Tiempo promedio'],
    filas,
  };
}

function equiposConMasDanos(tk) {
  // Cuenta tickets por daño; los antiguos sin tipo de salida también cuentan como daño
  const danos = tk.filter((t) => t.tipoSalida === 'Daño' || t.tipoSalida === 'Sin clasificar');
  const mapa = new Map();
  danos.forEach((t) => {
    const prev = mapa.get(t.idEquipo) || { equipo: t.equipo, codigo: t.codigo, ambiente: t.ambiente, total: 0, bajas: 0 };
    prev.total += 1;
    if (String(t.estado).toLowerCase() === 'dado de baja') prev.bajas += 1;
    mapa.set(t.idEquipo, prev);
  });
  const filas = [...mapa.values()]
    .sort((a, b) => b.total - a.total || a.equipo.localeCompare(b.equipo, 'es'))
    .slice(0, 15)
    .map((e) => [
      e.codigo, e.equipo, e.ambiente, e.total,
      e.bajas > 0 ? 'Ya dado de baja' : e.total >= 3 ? 'Candidato a baja' : e.total === 2 ? 'Reincidente' : '',
    ]);
  return {
    columnas: ['Código', 'Equipo', 'Ambiente', 'Daños', 'Observación'],
    filas,
    nota: 'Top 15. "Reincidente" = 2 daños; "Candidato a baja" = 3 o más.',
  };
}

function inventarioPorAmbiente(equiposFiltrados, ambientes) {
  const estados = [...new Set(equiposFiltrados.map((e) => String(e.estado || 'sin estado').toLowerCase().trim()))].sort();
  const mAmb = Object.fromEntries((ambientes || []).map((a) => [a.id_ambiente, a.nombre_a]));
  const grupos = new Map();
  equiposFiltrados.forEach((e) => {
    const nombre = mAmb[e.id_ambiente] || 'Sin ambiente';
    if (!grupos.has(nombre)) grupos.set(nombre, {});
    const g = grupos.get(nombre);
    const est = String(e.estado || 'sin estado').toLowerCase().trim();
    g[est] = (g[est] || 0) + 1;
  });
  const filas = [...grupos.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'es'))
    .map(([nombre, g]) => {
      const cols = estados.map((s) => g[s] || 0);
      return [nombre, ...cols, cols.reduce((a, b) => a + b, 0)];
    });
  return {
    columnas: ['Ambiente', ...estados.map(mayusInicial), 'Total'],
    filas,
  };
}

function usuariosPorRol(usuarios, roles) {
  const mRoles = Object.fromEntries((roles || []).map((r) => [r.id_rol, r.nombre_rol]));
  const hayCampoActivo = (usuarios || []).some((u) => typeof u.activo === 'boolean');
  const grupos = new Map();
  (usuarios || []).forEach((u) => {
    const crudo = String(mRoles[u.id_rol] || 'sin rol').toLowerCase();
    const nombre = crudo === 'tecnico' ? 'Técnico' : mayusInicial(crudo.replace(/_/g, ' '));
    const g = grupos.get(nombre) || { total: 0, pendientes: 0 };
    g.total += 1;
    if (u.activo === false) g.pendientes += 1;
    grupos.set(nombre, g);
  });
  const filas = [...grupos.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([rol, g]) => [rol, g.total, hayCampoActivo ? g.total - g.pendientes : 'N/D', hayCampoActivo ? g.pendientes : 'N/D']);
  return {
    columnas: ['Rol', 'Total', 'Con cuenta activa', 'Pendientes de activar'],
    filas,
    nota: hayCampoActivo
      ? undefined
      : 'El backend aún no devuelve el campo "activo" en /usuarios, por eso no se puede separar activos y pendientes.',
  };
}

function listadoDetallado(tk) {
  const filas = [...tk]
    .sort((a, b) => (b.fecha || 0) - (a.fecha || 0))
    .map((t) => [
      t.id,
      formatearFecha(t.fecha),
      t.ambiente,
      t.equipo,
      t.codigo,
      t.serial,
      t.tipoActivo,
      t.motivo,
      t.tipoSalida,
      t.estado,
      t.motivoNovedad || '',
      t.creadoPor,
      t.tecnico || 'Sin asignar',
      t.atendido ? 'Sí' : 'No',
      formatearFecha(t.cierre),
    ]);
  return {
    columnas: [
      'Ticket', 'Fecha', 'Ambiente', 'Equipo', 'Código', 'Serial', 'Tipo de activo', 'Motivo',
      'Tipo de salida', 'Estado', 'Motivo de novedad', 'Creado por', 'Técnico', 'Atendido', 'Fecha de cierre',
    ],
    filas,
  };
}

// ------------------------------------------------------------------
// Catálogo: orden y textos de los 12 reportes
// ------------------------------------------------------------------
export const CATALOGO_REPORTES = [
  { id: 'resumen', titulo: 'Resumen general', descripcion: 'Total de tickets, atendidos, tasa de atención y tiempo promedio de resolución', calcular: (c) => resumenGeneral(c.tickets) },
  { id: 'ambiente', titulo: 'Tickets por ambiente', descripcion: 'Cuántos reportes tiene cada ambiente', calcular: (c) => porAmbiente(c.tickets) },
  { id: 'mes', titulo: 'Tickets por mes del año', descripcion: 'Cuántos tickets se crearon mes a mes', calcular: (c) => porMes(c.tickets, c.filtros) },
  { id: 'estado', titulo: 'Tickets por estado', descripcion: 'Pendiente, en reparación, reparado, etc.', calcular: (c) => porEstado(c.tickets, c.estados) },
  { id: 'tipo', titulo: 'Tickets por tipo de activo', descripcion: 'Reportes agrupados por tipo de equipo', calcular: (c) => porTipoActivo(c.tickets) },
  { id: 'salidas', titulo: 'Salidas por tipo', descripcion: 'Daño, traslado o préstamo', calcular: (c) => salidasPorTipo(c.tickets) },
  { id: 'motivos', titulo: 'Motivos de novedad más frecuentes', descripcion: 'Por qué se dieron de baja los equipos', calcular: (c) => motivosNovedad(c.tickets) },
  { id: 'tecnicos', titulo: 'Rendimiento por técnico', descripcion: 'Asignados, resueltos y tiempo promedio', calcular: (c) => rendimientoTecnico(c.tickets, c.usuarios, c.roles) },
  { id: 'danos', titulo: 'Equipos con más daños', descripcion: 'Los reincidentes, candidatos a dar de baja', calcular: (c) => equiposConMasDanos(c.tickets) },
  { id: 'inventario', titulo: 'Inventario por ambiente y estado', descripcion: 'Cuántos equipos hay en cada estado por ambiente (no depende de fechas)', calcular: (c) => inventarioPorAmbiente(c.equipos, c.ambientes) },
  { id: 'usuarios', titulo: 'Usuarios por rol', descripcion: 'Incluye los que aún no activan su cuenta (no depende de filtros)', calcular: (c) => usuariosPorRol(c.usuarios, c.roles) },
  { id: 'detalle', titulo: 'Listado detallado de tickets', descripcion: 'Un ticket por fila, ideal para la hoja de Excel', calcular: (c) => listadoDetallado(c.tickets) },
];

// Calcula los reportes pedidos. `datos` trae los catálogos crudos del backend.
export function generarReportes(idsSeleccionados, datos, filtros) {
  const filas = construirFilasTickets(datos);
  const contexto = {
    filtros,
    tickets: filtrarTickets(filas, filtros),
    equipos: filtrarEquipos(datos.equipos, filtros),
    ambientes: datos.ambientes,
    usuarios: datos.usuarios,
    roles: datos.roles,
    estados: datos.estados,
  };
  return CATALOGO_REPORTES
    .filter((r) => idsSeleccionados.includes(r.id))
    .map((r) => ({ id: r.id, titulo: r.titulo, descripcion: r.descripcion, ...r.calcular(contexto) }));
}

// Texto legible de los filtros para encabezados de PDF / Excel
export function describirFiltros(filtros, ambientes, tiposEquipo) {
  const amb = filtros.idAmbiente === ''
    ? 'Todos'
    : (ambientes || []).find((a) => String(a.id_ambiente) === String(filtros.idAmbiente))?.nombre_a || filtros.idAmbiente;
  const tipo = filtros.idTipo === ''
    ? 'Todos'
    : (tiposEquipo || []).find((t) => String(t.id_tipo) === String(filtros.idTipo))?.nombre_t || filtros.idTipo;
  const desde = filtros.desde ? formatearFecha(new Date(`${filtros.desde}T00:00:00`)) : 'Sin límite';
  const hasta = filtros.hasta ? formatearFecha(new Date(`${filtros.hasta}T00:00:00`)) : 'Sin límite';
  return [
    ['Fecha desde', desde],
    ['Fecha hasta', hasta],
    ['Ambiente', amb],
    ['Tipo de activo', tipo],
  ];
}
