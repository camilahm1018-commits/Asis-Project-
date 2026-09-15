// src/pages/Administrador/AmbientesAdministrador.jsx
// Ruta: /administrador/ambientes
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import {
  listarAmbientes, crearAmbiente, editarAmbiente, eliminarAmbiente,
  listarEquipos, listarUsuarios, listarRoles,
} from '../../services/adminService.js';

const formularioVacio = {
  id_ambiente: '', nombre_a: '', ubicacion: '', capacidad_equipos: '', descripcion: '', id_cuentadante: '',
};

function AmbientesAdministrador() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [ambientes, setAmbientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cuentadantes, setCuentadantes] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState(formularioVacio);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  async function cargar() {
    try {
      setCargando(true);
      const [a, e, u, r] = await Promise.all([listarAmbientes(), listarEquipos(), listarUsuarios(), listarRoles()]);
      const idRolCuentadante = (r || []).find((rol) => rol.nombre_rol === 'cuentadante')?.id_rol;
      setAmbientes(a || []);
      setEquipos(e || []);
      setCuentadantes((u || []).filter((usr) => usr.id_rol === idRolCuentadante));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const mapaCuentadantes = Object.fromEntries(cuentadantes.map((c) => [c.id_usuario, `${c.nombre_u} ${c.apellidos_u}`]));

  function abrirCrear() {
    setForm(formularioVacio);
    setModoEdicion(false);
    setErrorModal('');
    setShowModal(true);
  }

  function abrirEditar(a) {
    setForm({
      id_ambiente: a.id_ambiente,
      nombre_a: a.nombre_a,
      ubicacion: a.ubicacion,
      capacidad_equipos: a.capacidad_equipos ?? '',
      descripcion: a.descripcion ?? '',
      id_cuentadante: a.id_cuentadante ?? '',
    });
    setModoEdicion(true);
    setErrorModal('');
    setShowModal(true);
  }

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorModal('');
    setGuardando(true);

    const datos = {
      nombre_a: form.nombre_a,
      ubicacion: form.ubicacion,
      capacidad_equipos: form.capacidad_equipos ? Number(form.capacidad_equipos) : null,
      estado: 'activo',
      descripcion: form.descripcion,
      id_cuentadante: form.id_cuentadante ? Number(form.id_cuentadante) : null,
    };

    try {
      if (modoEdicion) {
        await editarAmbiente(form.id_ambiente, datos);
      } else {
        await crearAmbiente({ id_ambiente: Number(form.id_ambiente), ...datos });
      }
      setShowModal(false);
      cargar();
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(a) {
    if (!window.confirm(`¿Eliminar el ambiente "${a.nombre_a}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarAmbiente(a.id_ambiente);
      cargar();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <AdminLayout title="Ambientes">
      {showModal && (
        <div className="pa-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pa-modal__header">
              <h2 className="pa-modal__title">{modoEdicion ? 'Editar Ambiente' : 'Registrar Ambiente'}</h2>
              <button className="pa-modal__close" onClick={() => setShowModal(false)} type="button">✕</button>
            </div>
            <form onSubmit={handleGuardar}>
              <div className="pa-modal__body">
                {errorModal && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{errorModal}</p>}
                <div className="pa-form-field">
                  <label>ID del Ambiente</label>
                  <input
                    className="pa-input"
                    type="number"
                    value={form.id_ambiente}
                    onChange={(e) => handleChange('id_ambiente', e.target.value)}
                    placeholder="205"
                    required
                    disabled={modoEdicion}
                  />
                </div>
                <div className="pa-form-field">
                  <label>Nombre del Ambiente</label>
                  <input className="pa-input" value={form.nombre_a} onChange={(e) => handleChange('nombre_a', e.target.value)} placeholder="Laboratorio 3" required />
                </div>
                <div className="pa-form-field">
                  <label>Ubicación</label>
                  <input className="pa-input" value={form.ubicacion} onChange={(e) => handleChange('ubicacion', e.target.value)} placeholder="Bloque A - Piso 1" required />
                </div>
                <div className="pa-form-field">
                  <label>Capacidad de Equipos</label>
                  <input className="pa-input" type="number" value={form.capacidad_equipos} onChange={(e) => handleChange('capacidad_equipos', e.target.value)} placeholder="30" />
                </div>
                <div className="pa-form-field">
                  <label>Cuentadante a cargo</label>
                  <select className="pa-select" value={form.id_cuentadante} onChange={(e) => handleChange('id_cuentadante', e.target.value)}>
                    <option value="">Sin asignar</option>
                    {cuentadantes.length === 0 && (
                      <option value="" disabled>No hay cuentadantes registrados</option>
                    )}
                    {cuentadantes.map((c) => (
                      <option key={c.id_usuario} value={c.id_usuario}>{c.nombre_u} {c.apellidos_u}</option>
                    ))}
                  </select>
                </div>
                <div className="pa-form-field">
                  <label>Descripción</label>
                  <textarea className="pa-textarea" rows={3} value={form.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} placeholder="Descripción del ambiente..." />
                </div>
                <div className="pa-modal__actions">
                  <button type="button" className="pa-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="pa-btn-primary" disabled={guardando}>
                    {guardando ? 'Guardando...' : modoEdicion ? 'Guardar Cambios' : 'Registrar'}
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
        <button className="pa-btn-primary" onClick={abrirCrear} type="button">+ Nuevo Ambiente</button>
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
                  <span>Cuentadante: {mapaCuentadantes[a.id_cuentadante] || '—'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="pa-btn-secondary" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} onClick={() => abrirEditar(a)} type="button">Editar</button>
                  <button className="pa-btn-secondary" style={{ flex: 1, fontSize: 12, padding: '6px 10px', color: '#f87171' }} onClick={() => handleEliminar(a)} type="button">Eliminar</button>
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
