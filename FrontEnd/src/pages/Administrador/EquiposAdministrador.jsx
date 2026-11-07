// src/pages/EquiposAdministrador.jsx
// Ruta: /administrador/equipos
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import {
  listarEquipos, crearEquipo, listarAmbientes, listarTiposEquipo,
} from '../../services/adminService.js';

const badgeColorPorEstado = {
  activo: 'pa-badge--success',
  dañado: 'pa-badge--danger',
  mantenimiento: 'pa-badge--warning',
  baja: 'pa-badge--neutral',
};

function EquiposAdministrador() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [serial, setSerial] = useState('');
  const [ambienteId, setAmbienteId] = useState('');
  const [tipoId, setTipoId] = useState('');

  async function cargar() {
    try {
      setCargando(true);
      const [e, a, t] = await Promise.all([listarEquipos(), listarAmbientes(), listarTiposEquipo()]);
      setEquipos(e || []);
      setAmbientes(a || []);
      setTiposEquipo(t || []);
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

  const filtros = ['Todos', 'activo', 'dañado', 'mantenimiento', 'baja'];
  const filtered = filtro === 'Todos' ? equipos : equipos.filter((e) => e.estado === filtro);

  function limpiarFormulario() {
    setCodigo(''); setNombre(''); setMarca(''); setSerial('');
    setAmbienteId(''); setTipoId(''); setErrorModal('');
  }

  async function handleRegistrar(e) {
    e.preventDefault();
    setErrorModal('');
    setGuardando(true);
    try {
      await crearEquipo({
        codigo,
        nombre,
        marca,
        serial,
        descripcion: '',
        estado: 'activo',
        id_ambiente: Number(ambienteId),
        id_tipo: Number(tipoId),
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
    <AdminLayout title="Equipos">
      {showModal && (
        <div className="pa-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pa-modal__header">
              <h2 className="pa-modal__title">Registrar Equipo</h2>
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
                  <label>Ambiente</label>
                  <select className="pa-select" value={ambienteId} onChange={(e) => setAmbienteId(e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    {ambientes.map((a) => (
                      <option key={a.id_ambiente} value={a.id_ambiente}>{a.nombre_a}</option>
                    ))}
                  </select>
                </div>
                <div className="pa-form-field">
                  <label>Tipo de Equipo</label>
                  <select className="pa-select" value={tipoId} onChange={(e) => setTipoId(e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    {tiposEquipo.map((t) => (
                      <option key={t.id_tipo} value={t.id_tipo}>{t.nombre_t}</option>
                    ))}
                  </select>
                </div>
                <div className="pa-modal__actions">
                  <button type="button" className="pa-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="pa-btn-primary" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Registrar Equipo'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Equipos</h1>
          <p className="pa-section-header__subtitle">Inventario completo de activos tecnológicos</p>
        </div>
        <button className="pa-btn-primary" onClick={() => setShowModal(true)} type="button">+ Nuevo Equipo</button>
      </div>

      <div className="pa-filter-row">
        {filtros.map((f) => (
          <button
            key={f}
            className={`pa-filter-pill${filtro === f ? ' active' : ''}`}
            onClick={() => setFiltro(f)}
            type="button"
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando equipos...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Equipo</th>
                <th>Marca</th>
                <th>Tipo</th>
                <th>Ambiente</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id_equipo}>
                  <td className="pa-table-mono" style={{ color: '#45B3BF' }}>{e.codigo}</td>
                  <td>
                    <div>{e.nombre}</div>
                    <div className="pa-table-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>S/N {e.serial || '—'}</div>
                  </td>
                  <td>{e.marca || '—'}</td>
                  <td>{mapaTipos[e.id_tipo] || '—'}</td>
                  <td>{mapaAmbientes[e.id_ambiente] || '—'}</td>
                  <td><span className={`pa-badge ${badgeColorPorEstado[e.estado] || 'pa-badge--neutral'}`}>{e.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="pa-empty-state">
              <span className="pa-empty-state__icon">💻</span>
              <p className="pa-empty-state__title">No hay equipos para este filtro</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default EquiposAdministrador;
