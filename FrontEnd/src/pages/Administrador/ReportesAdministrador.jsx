// src/pages/Administrador/ReportesAdministrador.jsx
// Ruta: /administrador/reportes
// Centro de Reportes (RF-014): filtros + selección de reportes + exportar
// un solo PDF o un solo Excel con lo marcado. Solo el administrador exporta.
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import {
  listarUsuarios, listarEquipos, listarAmbientes, listarTicketsCrudos, listarRoles,
  listarTiposEquipo, listarEstadosTicket, listarMotivosNovedad, listarHistorialTickets,
  obtenerUsuarioActual,
} from '../../services/adminService.js';
import { CATALOGO_REPORTES, generarReportes } from './reportes/calculos.js';
import { exportarPDF } from './reportes/exportarPDF.js';
import { exportarExcel } from './reportes/exportarExcel.js';
import "../../styles/centroReportes.css";
const FILTROS_VACIOS = { anio: '', desde: '', hasta: '', idAmbiente: '', idTipo: '' };

function ReportesAdministrador() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [datos, setDatos] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [seleccion, setSeleccion] = useState(() => new Set(['resumen', 'ambiente', 'mes']));
  const [exportando, setExportando] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', error: false });

  useEffect(() => {
    async function cargar() {
      try {
        // El historial puede fallar sin romper el resto: solo afecta el tiempo de resolución
        const [usuarios, equipos, ambientes, tickets, roles, tiposEquipo, estados, motivos, historial] =
          await Promise.all([
            listarUsuarios(), listarEquipos(), listarAmbientes(), listarTicketsCrudos(), listarRoles(),
            listarTiposEquipo(), listarEstadosTicket(), listarMotivosNovedad(),
            listarHistorialTickets().catch(() => []),
          ]);
        setDatos({
          usuarios: usuarios || [], equipos: equipos || [], ambientes: ambientes || [],
          tickets: tickets || [], roles: roles || [], tiposEquipo: tiposEquipo || [],
          estados: estados || [], motivos: motivos || [], historial: historial || [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  // Años que realmente tienen tickets, para el selector
  const anios = useMemo(() => {
    if (!datos) return [];
    const set = new Set();
    datos.tickets.forEach((t) => { if (t.creado_en) set.add(new Date(t.creado_en).getFullYear()); });
    set.add(new Date().getFullYear());
    return [...set].filter((a) => !Number.isNaN(a)).sort((a, b) => b - a);
  }, [datos]);

  // Filtros "limpios" para los cálculos (el año se traduce a desde/hasta)
  const filtrosCalculo = useMemo(() => ({
    desde: filtros.desde, hasta: filtros.hasta, idAmbiente: filtros.idAmbiente, idTipo: filtros.idTipo,
  }), [filtros]);

  // Filas de cada reporte con los filtros actuales (muestra "N filas" junto a cada casilla)
  const previa = useMemo(() => {
    if (!datos) return {};
    const todos = generarReportes(CATALOGO_REPORTES.map((r) => r.id), datos, filtrosCalculo);
    return Object.fromEntries(todos.map((r) => [r.id, r.filas.length]));
  }, [datos, filtrosCalculo]);

  function cambiarAnio(valor) {
    if (valor === '') {
      setFiltros((f) => ({ ...f, anio: '', desde: '', hasta: '' }));
    } else {
      setFiltros((f) => ({ ...f, anio: valor, desde: `${valor}-01-01`, hasta: `${valor}-12-31` }));
    }
  }

  function cambiarFecha(campo, valor) {
    // Editar el rango a mano deja de ser "un año completo"
    setFiltros((f) => ({ ...f, anio: '', [campo]: valor }));
  }

  function alternar(id) {
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id);
      return nuevo;
    });
  }

  const rangoInvalido = filtros.desde && filtros.hasta && filtros.desde > filtros.hasta;
  const puedeExportar = seleccion.size > 0 && !rangoInvalido && !exportando;

  async function exportar(formato) {
    if (!puedeExportar) return;
    setExportando(formato);
    setMensaje({ texto: '', error: false });
    try {
      // Se respeta el orden del catálogo, no el orden en que se marcaron
      const ids = CATALOGO_REPORTES.map((r) => r.id).filter((id) => seleccion.has(id));
      const reportes = generarReportes(ids, datos, filtrosCalculo);
      const usuario = obtenerUsuarioActual();
      const opciones = {
        reportes,
        filtros: filtrosCalculo,
        ambientes: datos.ambientes,
        tiposEquipo: datos.tiposEquipo,
        generadoPor: usuario ? `${usuario.nombre ?? ''} ${usuario.apellidos ?? ''}`.trim() : '',
      };
      if (formato === 'pdf') await exportarPDF(opciones); else await exportarExcel(opciones);
      setMensaje({ texto: `Archivo ${formato === 'pdf' ? 'PDF' : 'Excel'} generado con ${reportes.length} reporte(s).`, error: false });
    } catch (err) {
      console.error(err);
      setMensaje({ texto: `No se pudo generar el archivo: ${err.message}`, error: true });
    } finally {
      setExportando('');
    }
  }

  if (cargando) {
    return (
      <AdminLayout title="Reportes">
        <p className="pa-loading">Cargando datos para los reportes...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Reportes">
        <p className="pa-error">{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reportes">
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Centro de Reportes</h1>
          <p className="pa-section-header__subtitle">
            Elige los filtros y los reportes; se exportan juntos en un solo archivo
          </p>
        </div>
      </div>

      <div className="pa-card" style={{ marginBottom: 20 }}>
        <div className="pa-card__header">Filtros</div>
        <div className="pa-card__body">
          <div className="cr-filtros">
            <div className="pa-form-field">
              <label htmlFor="cr-anio">Año</label>
              <select id="cr-anio" className="pa-select" value={filtros.anio} onChange={(e) => cambiarAnio(e.target.value)}>
                <option value="">Todos</option>
                {anios.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="pa-form-field">
              <label htmlFor="cr-desde">Desde</label>
              <input id="cr-desde" type="date" className="pa-input" value={filtros.desde} onChange={(e) => cambiarFecha('desde', e.target.value)} />
            </div>
            <div className="pa-form-field">
              <label htmlFor="cr-hasta">Hasta</label>
              <input id="cr-hasta" type="date" className="pa-input" value={filtros.hasta} onChange={(e) => cambiarFecha('hasta', e.target.value)} />
            </div>
            <div className="pa-form-field">
              <label htmlFor="cr-ambiente">Ambiente</label>
              <select id="cr-ambiente" className="pa-select" value={filtros.idAmbiente} onChange={(e) => setFiltros((f) => ({ ...f, idAmbiente: e.target.value }))}>
                <option value="">Todos</option>
                {datos.ambientes.map((a) => <option key={a.id_ambiente} value={a.id_ambiente}>{a.nombre_a}</option>)}
              </select>
            </div>
            <div className="pa-form-field">
              <label htmlFor="cr-tipo">Tipo de activo</label>
              <select id="cr-tipo" className="pa-select" value={filtros.idTipo} onChange={(e) => setFiltros((f) => ({ ...f, idTipo: e.target.value }))}>
                <option value="">Todos</option>
                {datos.tiposEquipo.map((t) => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre_t}</option>)}
              </select>
            </div>
            <button type="button" className="pa-btn-secondary" onClick={() => setFiltros(FILTROS_VACIOS)}>
              Limpiar filtros
            </button>
          </div>
          {rangoInvalido && (
            <p className="pa-error" style={{ padding: 0, textAlign: 'left', marginTop: 12 }}>
              La fecha "Desde" no puede ser posterior a "Hasta".
            </p>
          )}
        </div>
      </div>

      <div className="pa-card">
        <div className="pa-card__header">Reportes a incluir ({seleccion.size} de {CATALOGO_REPORTES.length})</div>
        <div className="pa-card__body">
          <div className="cr-lista-acciones">
            <button type="button" className="pa-btn-secondary" onClick={() => setSeleccion(new Set(CATALOGO_REPORTES.map((r) => r.id)))}>
              Marcar todos
            </button>
            <button type="button" className="pa-btn-secondary" onClick={() => setSeleccion(new Set())}>
              Quitar todos
            </button>
          </div>

          <ul className="cr-lista">
            {CATALOGO_REPORTES.map((r) => (
              <li key={r.id}>
                <label className={`cr-item ${seleccion.has(r.id) ? 'marcado' : ''}`}>
                  <input type="checkbox" checked={seleccion.has(r.id)} onChange={() => alternar(r.id)} />
                  <span>
                    <span className="cr-item__titulo">{r.titulo}</span>
                    <span className="cr-item__desc">{r.descripcion}</span>
                  </span>
                  <span className="cr-item__filas">{previa[r.id] ?? 0} filas</span>
                </label>
              </li>
            ))}
          </ul>

          <div className="cr-barra">
            <button type="button" className="pa-btn-primary" disabled={!puedeExportar} onClick={() => exportar('pdf')}>
              {exportando === 'pdf' ? 'Generando PDF...' : 'Exportar PDF'}
            </button>
            <button type="button" className="pa-btn-primary" disabled={!puedeExportar} onClick={() => exportar('excel')}>
              {exportando === 'excel' ? 'Generando Excel...' : 'Exportar Excel'}
            </button>
            {seleccion.size === 0 && <span className="cr-barra__estado">Marca al menos un reporte.</span>}
            {mensaje.texto && (
              <span className={`cr-barra__estado ${mensaje.error ? 'cr-barra__estado--error' : ''}`} role="status">
                {mensaje.texto}
              </span>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ReportesAdministrador;
