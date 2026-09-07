// src/pages/cuentadante/InventarioCuentadante.jsx
// Ruta: /cuentadante/inventario
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsCuentadante } from './navItems.js';
import {
  listarEquipos, crearEquipo, listarAmbientes, listarTiposEquipo, listarTicketsAdministrador,
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
      setEquipos(e || []);
      setAmbientes(a || []);
      setTiposEquipo(te || []);
      setTickets(t);
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
    setErrorModal('');
    setGuardando(true);
    try {
      await crearEquipo({
        codigo, nombre, marca, serial, descripcion, estado: 'activo',
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
                    <input className="pa-input" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="PC-L1-001" required />
                  </div>
                  <div className="pa-form-field">
                    <label>Serial</label>
                    <input className="pa-input" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="SN1234567" />
                  </div>
                </div>
                <div className="pa-form-field">
                  <label>Nombre / Modelo</label>
                  <input className="pa-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="PC Dell OptiPlex 3090" required />
                </div>
                <div className="pa-form-field">
                  <label>Marca</label>
                  <input className="pa-input" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Dell" />
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

      {seleccionado && (
        <div className="pa-slideover-overlay" onClick={() => setSeleccionado(null)}>
          <div className="pa-slideover" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="pa-slideover__header">
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Detalle del Equipo</p>
              <button className="pa-modal__close" onClick={() => setSeleccionado(null)} type="button">✕</button>
            </div>
            <div className="pa-slideover__body">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="pa-table-mono" style={{ fontSize: 12, color: '#45B3BF' }}>{seleccionado.codigo}</span>
                <span className={`pa-badge ${badgeColorPorEstado[seleccionado.estado] || 'pa-badge--neutral'}`}>{seleccionado.estado}</span>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{seleccionado.nombre}</p>
                {seleccionado.descripcion && <p style={{ fontSize: 12, marginTop: 4, color: 'rgba(255,255,255,0.45)' }}>{seleccionado.descripcion}</p>}
              </div>
              {[
                { label: 'Marca', value: seleccionado.marca },
                { label: 'Serial', value: seleccionado.serial },
                { label: 'Tipo', value: mapaTipos[seleccionado.id_tipo] },
                { label: 'Ambiente', value: mapaAmbientes[seleccionado.id_ambiente] },
              ].map((f) => (
                <div key={f.label}>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#45B3BF', margin: '0 0 2px' }}>{f.label}</p>
                  <p style={{ fontSize: 13, margin: 0, color: 'rgba(255,255,255,0.8)' }}>{f.value || '—'}</p>
                </div>
              ))}
              <div>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#45B3BF', marginBottom: 8 }}>Tickets del equipo</p>
                {tickets.filter((t) => t.equipo === seleccionado.nombre).length === 0 ? (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Sin tickets registrados</p>
                ) : tickets.filter((t) => t.equipo === seleccionado.nombre).map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="pa-table-mono" style={{ fontSize: 11, color: '#45B3BF' }}>#{t.id}</span>
                    <span style={{ fontSize: 12, flex: 1, margin: '0 8px', color: 'rgba(255,255,255,0.6)' }}>{t.titulo}</span>
                    <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
            <thead><tr><th>Código</th><th>Equipo / Serial</th><th>Marca</th><th>Tipo</th><th>Ambiente</th><th>Estado</th><th>Tickets</th></tr></thead>
            <tbody>
              {filtered.map((e) => {
                const tkActivos = tickets.filter((t) => t.equipo === e.nombre && !t.atendido).length;
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
