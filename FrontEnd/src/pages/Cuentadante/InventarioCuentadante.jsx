// src/pages/cuentadante/InventarioCuentadante.jsx
// Ruta: /cuentadante/inventario
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import EquipoDetalleCard from '../../components/EquipoDetalleCard.jsx';
import { navItemsCuentadante } from './navItems.js';
import {
  listarEquipos, crearEquipo, listarAmbientes, listarTiposEquipo, listarTicketsAdministrador,
  obtenerUsuarioActual,
} from '../../services/adminService.js';

const badgeColorPorEstado = {
  activo: 'pa-badge--success',
  dañado: 'pa-badge--danger',
  mantenimiento: 'pa-badge--warning',
  baja: 'pa-badge--neutral',
};

function InventarioCuentadante() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [serial, setSerial] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ambienteId, setAmbienteId] = useState('');
  const [tipoId, setTipoId] = useState('');

  async function cargar() {
    try {
      setCargando(true);
      const [e, a, te, t] = await Promise.all([listarEquipos(), listarAmbientes(), listarTiposEquipo(), listarTicketsAdministrador()]);
      const usuarioActual = obtenerUsuarioActual();
      const misAmbientes = (a || []).filter((amb) => amb.id_cuentadante === usuarioActual?.id_usuario);
      const idsMisAmbientes = misAmbientes.map((amb) => amb.id_ambiente);
      
      setEquipos((e || []).filter((eq) => idsMisAmbientes.includes(eq.id_ambiente)));
      setAmbientes(misAmbientes);
      setTiposEquipo(te || []);
      setTickets(t || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const mapaAmbientes = Object.fromEntries(ambientes.map((a) => [a.id_ambiente, a.nombre_a]));
  const mapaTipos = Object.fromEntries(tiposEquipo.map((t) => [t.id_tipo, t.nombre_t]));

  const estadosFiltro = ['Todos', 'activo', 'dañado', 'mantenimiento', 'baja'];
  const filtered = filtroEstado === 'Todos' ? equipos : equipos.filter((e) => e.estado === filtroEstado);

  function limpiarFormulario() {
    setCodigo(''); setNombre(''); setMarca(''); setSerial(''); setDescripcion('');
    setAmbienteId(''); setTipoId(''); setErrorModal('');
  }

  async function handleRegistrar(e) {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim() || !ambienteId || !tipoId) {
      setErrorModal('Completa el código, nombre, ambiente y tipo del equipo.');
      return;
    }
    setErrorModal('');
    setGuardando(true);
    try {
      await crearEquipo({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        marca: marca.trim() || null,
        serial: serial.trim() || null,
        descripcion: descripcion.trim() || null,
        estado: 'activo',
        id_ambiente: Number(ambienteId), id_tipo: Number(tipoId),
      });
      setShowModal(false);
      limpiarFormulario();
      cargar();
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PanelLayout title="Inventario" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      {showModal && (
        <div className="pa-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pa-modal__header">
              <h2 className="pa-modal__title">Registrar Nuevo Equipo</h2>
              <button className="pa-modal__close" onClick={() => setShowModal(false)} type="button">✕</button>
            </div>
            <form onSubmit={handleRegistrar}>
              <div className="pa-modal__body">
                {errorModal && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{errorModal}</p>}
                <div className="pa-modal__row">
                  <div className="pa-form-field">
                    <label>Código</label>
                    <input className="pa-input" maxLength={25} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="PC-L1-001" required />
                  </div>
                  <div className="pa-form-field">
                    <label>Serial</label>
                    <input className="pa-input" maxLength={100} value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="SN1234567" />
                  </div>
                </div>
                <div className="pa-form-field">
                  <label>Nombre / Modelo</label>
                  <input className="pa-input" maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="PC Dell OptiPlex 3090" required />
                </div>
                <div className="pa-form-field">
                  <label>Marca</label>
                  <input className="pa-input" maxLength={100} value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Dell" />
                </div>
                <div className="pa-form-field">
                  <label>Descripción</label>
                  <textarea className="pa-textarea" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción del equipo..." />
                </div>
                <div className="pa-form-field">
                  <label>Ambiente</label>
                  <select className="pa-select" value={ambienteId} onChange={(e) => setAmbienteId(e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    {ambientes.map((a) => <option key={a.id_ambiente} value={a.id_ambiente}>{a.nombre_a}</option>)}
                  </select>
                </div>
                <div className="pa-form-field">
                  <label>Tipo de Equipo</label>
                  <select className="pa-select" value={tipoId} onChange={(e) => setTipoId(e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    {tiposEquipo.map((t) => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre_t}</option>)}
                  </select>
                </div>
                <div className="pa-modal__actions">
                  <button type="button" className="pa-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="pa-btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar Equipo'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <EquipoDetalleCard
        equipo={seleccionado}
        tipo={seleccionado ? mapaTipos[seleccionado.id_tipo] : ''}
        ambiente={seleccionado ? mapaAmbientes[seleccionado.id_ambiente] : ''}
        tickets={seleccionado ? tickets.filter((t) => t.idEquipo === seleccionado.id_equipo) : []}
        onClose={() => setSeleccionado(null)}
      />

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Inventario de Equipos</h1>
          <p className="pa-section-header__subtitle">{filtered.length} equipos encontrados</p>
        </div>
        <button className="pa-btn-primary" onClick={() => setShowModal(true)} type="button">+ Nuevo Equipo</button>
      </div>

      <div className="pa-filter-row">
        {estadosFiltro.map((f) => (
          <button key={f} className={`pa-filter-pill${filtroEstado === f ? ' active' : ''}`} onClick={() => setFiltroEstado(f)} type="button">
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando inventario...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Equipo / Serial</th>
                <th>Marca</th>
                <th>Tipo</th>
                <th>Ambiente</th>
                <th>Estado</th>
                <th>Tickets</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const tkActivos = tickets.filter((t) => t.idEquipo === e.id_equipo && !t.atendido).length;
                return (
                  <tr key={e.id_equipo} onClick={() => setSeleccionado(e)} style={{ cursor: 'pointer' }}>
                    <td className="pa-table-mono" style={{ color: '#45B3BF' }}>{e.codigo}</td>
                    <td>
                      <div>{e.nombre}</div>
                      <div className="pa-table-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{e.serial || '—'}</div>
                    </td>
                    <td>{e.marca || '—'}</td>
                    <td style={{ fontSize: 12 }}>{mapaTipos[e.id_tipo] || '—'}</td>
                    <td>{mapaAmbientes[e.id_ambiente] || '—'}</td>
                    <td><span className={`pa-badge ${badgeColorPorEstado[e.estado] || 'pa-badge--neutral'}`}>{e.estado}</span></td>
                    <td>
                      {tkActivos > 0
                        ? <span className="pa-badge pa-badge--danger">{tkActivos} activos</span>
                        : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="pa-empty-state">
              <span className="pa-empty-state__icon">📦</span>
              <p className="pa-empty-state__title">No hay equipos para este filtro</p>
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
}

export default InventarioCuentadante;