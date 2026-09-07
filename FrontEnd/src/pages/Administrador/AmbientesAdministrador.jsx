// src/pages/AmbientesAdministrador.jsx
// Ruta: /administrador/ambientes
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import { listarAmbientes, crearAmbiente, listarEquipos } from '../../services/adminService.js';

function AmbientesAdministrador() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [ambientes, setAmbientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  // El modelo AmbienteCrear pide id_ambiente manual (no autoincremental),
  // por eso el formulario también lo pide.
  const [idAmbiente, setIdAmbiente] = useState('');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [descripcion, setDescripcion] = useState('');

  async function cargar() {
    try {
      setCargando(true);
      const [a, e] = await Promise.all([listarAmbientes(), listarEquipos()]);
      setAmbientes(a || []);
      setEquipos(e || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function limpiarFormulario() {
    setIdAmbiente(''); setNombre(''); setUbicacion(''); setCapacidad(''); setDescripcion(''); setErrorModal('');
  }

  async function handleRegistrar(e) {
    e.preventDefault();
    setErrorModal('');
    setGuardando(true);
    try {
      await crearAmbiente({
        id_ambiente: Number(idAmbiente),
        nombre_a: nombre,
        ubicacion,
        capacidad_equipos: capacidad ? Number(capacidad) : null,
        estado: 'activo',
        descripcion,
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
    <AdminLayout title="Ambientes">
      {showModal && (
        <div className="pa-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pa-modal__header">
              <h2 className="pa-modal__title">Registrar Ambiente</h2>
              <button className="pa-modal__close" onClick={() => setShowModal(false)} type="button">✕</button>
            </div>
            <form onSubmit={handleRegistrar}>
              <div className="pa-modal__body">
                {errorModal && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{errorModal}</p>}
                <div className="pa-form-field">
                  <label>ID del Ambiente</label>
                  <input className="pa-input" type="number" value={idAmbiente} onChange={(e) => setIdAmbiente(e.target.value)} placeholder="205" required />
                </div>
                <div className="pa-form-field">
                  <label>Nombre del Ambiente</label>
                  <input className="pa-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Laboratorio 3" required />
                </div>
                <div className="pa-form-field">
                  <label>Ubicación</label>
                  <input className="pa-input" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Bloque A - Piso 1" required />
                </div>
                <div className="pa-form-field">
                  <label>Capacidad de Equipos</label>
                  <input className="pa-input" type="number" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} placeholder="30" />
                </div>
                <div className="pa-form-field">
                  <label>Descripción</label>
                  <textarea className="pa-textarea" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción del ambiente..." />
                </div>
                <div className="pa-modal__actions">
                  <button type="button" className="pa-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="pa-btn-primary" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Registrar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Ambientes</h1>
          <p className="pa-section-header__subtitle">Salas y laboratorios del centro de formación</p>
        </div>
        <button className="pa-btn-primary" onClick={() => setShowModal(true)} type="button">+ Nuevo Ambiente</button>
      </div>

      {cargando && <p className="pa-loading">Cargando ambientes...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-ambiente-grid">
          {ambientes.map((a) => {
            const eqAmbiente = equipos.filter((e) => e.id_ambiente === a.id_ambiente);
            const dañados = eqAmbiente.filter((e) => e.estado === 'dañado').length;
            const mantenimiento = eqAmbiente.filter((e) => e.estado === 'mantenimiento').length;
            return (
              <div key={a.id_ambiente} className="pa-ambiente-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{a.nombre_a}</p>
                    <p style={{ fontSize: 12, margin: '2px 0 0', color: 'rgba(255,255,255,0.45)' }}>{a.ubicacion}</p>
                  </div>
                  <span className="pa-badge pa-badge--info">{a.estado}</span>
                </div>
                {a.descripcion && (
                  <p style={{ fontSize: 12, margin: '12px 0', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{a.descripcion}</p>
                )}
                <div className="pa-ambiente-card__stats">
                  <div className="pa-ambiente-card__stat">
                    <p className="pa-ambiente-card__stat-value" style={{ color: '#45B3BF' }}>{eqAmbiente.length}</p>
                    <p className="pa-ambiente-card__stat-label">equipos</p>
                  </div>
                  <div className="pa-ambiente-card__stat">
                    <p className="pa-ambiente-card__stat-value" style={{ color: '#f87171' }}>{dañados}</p>
                    <p className="pa-ambiente-card__stat-label">dañados</p>
                  </div>
                  <div className="pa-ambiente-card__stat">
                    <p className="pa-ambiente-card__stat-value" style={{ color: '#facc15' }}>{mantenimiento}</p>
                    <p className="pa-ambiente-card__stat-label">mantenim.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  <span>Capacidad: {a.capacidad_equipos ?? '—'}</span>
                </div>
              </div>
            );
          })}
          {ambientes.length === 0 && (
            <div className="pa-empty-state">
              <span className="pa-empty-state__icon">🏫</span>
              <p className="pa-empty-state__title">No hay ambientes registrados</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default AmbientesAdministrador;
