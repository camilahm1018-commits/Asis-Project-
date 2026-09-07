// src/pages/UsuariosAdministrador.jsx
// Ruta: /administrador/usuarios
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import {
  listarUsuarios, crearUsuario, listarRoles,
} from '../../services/adminService.js';

const badgeColorPorRol = {
  administrador: 'pa-badge--purple',
  administrador_mesa_ayuda: 'pa-badge--info',
  tecnico: 'pa-badge--accent',
  instructor: 'pa-badge--orange',
  cuentadante: 'pa-badge--warning',
};

function iniciales(nombre, apellidos) {
  return `${nombre?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase();
}

function UsuariosAdministrador() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  // Campos del formulario de "Nuevo usuario".
  // TODO backend: falta id_tipo_identificacion en este formulario;
  // por ahora se envía fijo en 1 — cámbialo por un <select> real
  // cuando conectes el endpoint /Tipo_identificacion/.
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [idRol, setIdRol] = useState('');

  async function cargar() {
    try {
      setCargando(true);
      const [u, r] = await Promise.all([listarUsuarios(), listarRoles()]);
      setUsuarios(u || []);
      setRoles(r || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const mapaRoles = Object.fromEntries(roles.map((r) => [r.id_rol, r.nombre_rol]));
  const filtered = filtroRol === 'Todos' ? usuarios : usuarios.filter((u) => mapaRoles[u.id_rol] === filtroRol);

  function limpiarFormulario() {
    setNombre(''); setApellidos(''); setCorreo(''); setContrasena('');
    setNumeroDocumento(''); setIdRol(''); setErrorModal('');
  }

  async function handleRegistrar(e) {
    e.preventDefault();
    setErrorModal('');
    setGuardando(true);
    try {
      await crearUsuario({
        nombre_u: nombre,
        apellidos_u: apellidos,
        correo_u: correo,
        contrasena_u: contrasena,
        numero_documento: numeroDocumento,
        id_rol: idRol ? Number(idRol) : null,
        id_tipo_identificacion: 1,
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
    <AdminLayout title="Usuarios">
      {showModal && (
        <div className="pa-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pa-modal__header">
              <h2 className="pa-modal__title">Registrar Nuevo Usuario</h2>
              <button className="pa-modal__close" onClick={() => setShowModal(false)} type="button">✕</button>
            </div>
            <form onSubmit={handleRegistrar}>
              <div className="pa-modal__body">
                {errorModal && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{errorModal}</p>}
                <div className="pa-modal__row">
                  <div className="pa-form-field">
                    <label>Nombre</label>
                    <input className="pa-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" required />
                  </div>
                  <div className="pa-form-field">
                    <label>Apellidos</label>
                    <input className="pa-input" value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Apellidos" required />
                  </div>
                </div>
                <div className="pa-form-field">
                  <label>Correo SENA</label>
                  <input className="pa-input" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="usuario@sena.edu.co" required />
                </div>
                <div className="pa-form-field">
                  <label>Contraseña</label>
                  <input className="pa-input" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="pa-form-field">
                  <label>Número de Documento</label>
                  <input className="pa-input" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} placeholder="1023456789" required />
                </div>
                <div className="pa-form-field">
                  <label>Rol</label>
                  <select className="pa-select" value={idRol} onChange={(e) => setIdRol(e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    {roles.map((r) => (
                      <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                    ))}
                  </select>
                </div>
                <div className="pa-modal__actions">
                  <button type="button" className="pa-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="pa-btn-primary" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Registrar Usuario'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Usuarios</h1>
          <p className="pa-section-header__subtitle">Gestión de usuarios del sistema</p>
        </div>
        <button className="pa-btn-primary" onClick={() => setShowModal(true)} type="button">+ Nuevo Usuario</button>
      </div>

      <div className="pa-filter-row">
        <button className={`pa-filter-pill${filtroRol === 'Todos' ? ' active' : ''}`} onClick={() => setFiltroRol('Todos')} type="button">Todos</button>
        {roles.map((r) => (
          <button
            key={r.id_rol}
            className={`pa-filter-pill${filtroRol === r.nombre_rol ? ' active' : ''}`}
            onClick={() => setFiltroRol(r.nombre_rol)}
            type="button"
          >
            {r.nombre_rol}
          </button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando usuarios...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Documento</th>
                <th>Rol</th>
                <th>Registrado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id_usuario}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="pa-avatar pa-avatar--sm">{iniciales(u.nombre_u, u.apellidos_u)}</span>
                      <span>{u.nombre_u} {u.apellidos_u}</span>
                    </div>
                  </td>
                  <td className="pa-table-mono">{u.correo_u}</td>
                  <td className="pa-table-mono">{u.numero_documento}</td>
                  <td>
                    <span className={`pa-badge ${badgeColorPorRol[mapaRoles[u.id_rol]] || 'pa-badge--neutral'}`}>
                      {mapaRoles[u.id_rol] || 'Sin rol'}
                    </span>
                  </td>
                  <td className="pa-table-mono">{new Date(u.creado_en).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="pa-empty-state">
              <span className="pa-empty-state__icon">👥</span>
              <p className="pa-empty-state__title">No hay usuarios para este filtro</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default UsuariosAdministrador;
