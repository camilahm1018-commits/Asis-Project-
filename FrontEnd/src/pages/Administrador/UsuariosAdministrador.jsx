// src/pages/Administrador/UsuariosAdministrador.jsx
// Ruta: /administrador/usuarios
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import {
  listarUsuarios, preRegistrarUsuario, listarRoles, listarTiposIdentificacion,
  editarUsuario, eliminarUsuario, obtenerUsuarioActual,
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

const formularioVacio = {
  id_tipo_identificacion: '',
  numero_documento: '',
  nombre_u: '',
  apellidos_u: '',
  correo_u: '',
  telefono_u: '',
  id_rol: '',
};

function UsuariosAdministrador() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tiposIdentificacion, setTiposIdentificacion] = useState([]);
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [errorModal, setErrorModal] = useState('');
  const [preRegistrado, setPreRegistrado] = useState(null);
  const [idEditando, setIdEditando] = useState(null);
  const [form, setForm] = useState(formularioVacio);
  const idActual = obtenerUsuarioActual()?.id_usuario;
  const editando = idEditando !== null;

  useEffect(() => {
    async function cargar() {
      try {
        const [u, r, tipos] = await Promise.all([
          listarUsuarios(), listarRoles(), listarTiposIdentificacion(),
        ]);
        setUsuarios(u);
        setRoles(r);
        setTiposIdentificacion(tipos);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const mapaRoles = Object.fromEntries(roles.map((r) => [r.id_rol, r.nombre_rol]));
  const filtered = filtroRol === 'Todos' ? usuarios : usuarios.filter((u) => mapaRoles[u.id_rol] === filtroRol);

  function abrirModal(usuario = null) {
    setForm(usuario ? {
      ...formularioVacio,
      ...Object.fromEntries(Object.keys(formularioVacio).map((campo) => [campo, usuario[campo] ?? ''])),
    } : formularioVacio);
    setIdEditando(usuario?.id_usuario ?? null);
    setErrorModal('');
    setError('');
    setMensaje('');
    setPreRegistrado(null);
    setShowModal(true);
  }

  function actualizarCampo(e) {
    const { name, value } = e.target;
    setForm((anterior) => ({ ...anterior, [name]: value }));
  }

  async function handleGuardar(e) {
    e.preventDefault();
    const datos = {
      nombre_u: form.nombre_u.trim(),
      apellidos_u: form.apellidos_u.trim(),
      correo_u: form.correo_u.trim().toLowerCase(),
      numero_documento: form.numero_documento.trim(),
      telefono_u: form.telefono_u.trim() || null,
      id_rol: Number(form.id_rol),
      id_tipo_identificacion: Number(form.id_tipo_identificacion),
    };
    if (!datos.nombre_u || !datos.apellidos_u || !datos.correo_u || !datos.numero_documento
        || !datos.id_rol || !datos.id_tipo_identificacion) {
      setErrorModal('Completa los campos obligatorios.');
      return;
    }
    setErrorModal('');
    setGuardando(true);
    try {
      if (editando) {
        const actualizado = await editarUsuario(idEditando, datos);
        setUsuarios((anteriores) => anteriores.map((u) => u.id_usuario === idEditando ? actualizado : u));
        if (idEditando === idActual) {
          localStorage.setItem('usuario', JSON.stringify({
            ...obtenerUsuarioActual(), nombre: actualizado.nombre_u, apellidos: actualizado.apellidos_u,
          }));
          window.dispatchEvent(new Event('usuario-actualizado'));
        }
        setMensaje('Usuario actualizado.');
        setShowModal(false);
      } else {
        const nuevo = await preRegistrarUsuario(datos);
        setUsuarios((anteriores) => [...anteriores, nuevo]);
        setPreRegistrado(nuevo);
      }
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(usuario) {
    if (!window.confirm(`¿Eliminar la cuenta de ${usuario.nombre_u} ${usuario.apellidos_u}?`)) return;
    setEliminando(usuario.id_usuario);
    setError('');
    setMensaje('');
    try {
      await eliminarUsuario(usuario.id_usuario);
      setUsuarios((anteriores) => anteriores.filter((u) => u.id_usuario !== usuario.id_usuario));
      setMensaje('Usuario eliminado.');
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(null);
    }
  }

  return (
    <AdminLayout title="Usuarios">
      {showModal && (
        <div className="pa-modal-overlay" onClick={() => !guardando && setShowModal(false)}>
          <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pa-modal__header">
              <h2 className="pa-modal__title">{editando ? 'Editar usuario' : 'Pre-registrar usuario'}</h2>
              <button className="pa-modal__close" onClick={() => !guardando && setShowModal(false)} type="button">✕</button>
            </div>

            {preRegistrado ? (
              <div className="pa-modal__body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>✅</div>
                <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.5 }}>
                  <strong>{preRegistrado.nombre_u}</strong> quedó pre-registrado. 
                  Le llegará un correo de activación a <br/>
                  <strong style={{ color: '#45B3BF' }}>{preRegistrado.correo_u}</strong>.
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
                  (Nota: Si no hay un servidor SMTP real configurado, el link de activación se imprime en la consola del backend).
                </p>
                <button className="pa-btn-primary" style={{ marginTop: 20 }} onClick={() => !guardando && setShowModal(false)} type="button">Entendido</button>
              </div>
            ) : (
              <form onSubmit={handleGuardar}>
                <div className="pa-modal__body">
                  {errorModal && <p className="pa-error" style={{ padding: 0, textAlign: 'left', marginBottom: 16 }}>{errorModal}</p>}
                  {!editando && (
                    <p>El usuario recibirá un correo para crear su contraseña y activar la cuenta.</p>
                  )}

                  <div className="pa-modal__row">
                    <div className="pa-form-field">
                      <label htmlFor="usuario-tipo">Tipo de documento *</label>
                      <select id="usuario-tipo" name="id_tipo_identificacion" className="pa-select" value={form.id_tipo_identificacion} onChange={actualizarCampo} required>
                        <option value="">Seleccione...</option>
                        {tiposIdentificacion.map((tipo) => (
                          <option key={tipo.id_tipo_id} value={tipo.id_tipo_id}>{tipo.nombre_tipo} ({tipo.iniciales})</option>
                        ))}
                      </select>
                    </div>
                    <div className="pa-form-field">
                      <label htmlFor="usuario-documento">Número de documento *</label>
                      <input id="usuario-documento" name="numero_documento" className="pa-input" value={form.numero_documento} onChange={actualizarCampo} maxLength={20} required />
                    </div>
                  </div>

                  <div className="pa-modal__row">
                    <div className="pa-form-field">
                      <label htmlFor="usuario-nombre">Nombre *</label>
                      <input id="usuario-nombre" name="nombre_u" className="pa-input" value={form.nombre_u} onChange={actualizarCampo} maxLength={50} required />
                    </div>
                    <div className="pa-form-field">
                      <label htmlFor="usuario-apellidos">Apellidos *</label>
                      <input id="usuario-apellidos" name="apellidos_u" className="pa-input" value={form.apellidos_u} onChange={actualizarCampo} maxLength={100} required />
                    </div>
                  </div>

                  <div className="pa-form-field">
                    <label htmlFor="usuario-correo">Correo *</label>
                    <input id="usuario-correo" name="correo_u" className="pa-input" type="email" value={form.correo_u} onChange={actualizarCampo} maxLength={100} required />
                  </div>

                  <div className="pa-form-field">
                    <label htmlFor="usuario-telefono">Teléfono para SMS (opcional)</label>
                    <input id="usuario-telefono" name="telefono_u" className="pa-input" type="tel" value={form.telefono_u} onChange={actualizarCampo} maxLength={20} placeholder="+573001234567" />
                  </div>

                  <div className="pa-form-field">
                    <label htmlFor="usuario-rol">Rol en el sistema *</label>
                    <select id="usuario-rol" name="id_rol" className="pa-select" value={form.id_rol} onChange={actualizarCampo} required disabled={editando && idEditando === idActual}>
                      <option value="">Seleccionar rol...</option>
                      {roles.map((r) => (
                        <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pa-modal__actions" style={{ marginTop: 24 }}>
                    <button type="button" className="pa-btn-secondary" onClick={() => !guardando && setShowModal(false)}>Cancelar</button>
                    <button type="submit" className="pa-btn-primary" disabled={guardando}>
                      {guardando ? 'Procesando...' : editando ? 'Guardar cambios' : 'Pre-registrar y enviar activación'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Usuarios</h1>
          <p className="pa-section-header__subtitle">Gestión y pre-registro de usuarios del sistema</p>
        </div>
        <button className="pa-btn-primary" onClick={() => abrirModal()} disabled={cargando || !roles.length || !tiposIdentificacion.length} type="button">+ Nuevo Usuario</button>
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
      {error && <p className="pa-error" role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}

      {!cargando && (
        <div className="pa-table-wrap pa-usuarios-tabla">
          <table className="pa-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Documento</th>
                <th>Rol</th>
                <th>Estado de Cuenta</th>
                <th>Registrado</th>
                <th>Acciones</th>
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
                  <td className="pa-table-mono pa-usuarios-correo">{u.correo_u}</td>
                  <td className="pa-table-mono">{u.numero_documento}</td>
                  <td>
                    <span className={`pa-badge ${badgeColorPorRol[mapaRoles[u.id_rol]] || 'pa-badge--neutral'}`}>
                      {mapaRoles[u.id_rol] || 'Sin rol'}
                    </span>
                  </td>
                  <td>
                    <span className={`pa-badge ${u.activo ? 'pa-badge--success' : 'pa-badge--warning'}`}>
                      {u.activo ? '✅ Activa' : '⏳ Pendiente'}
                    </span>
                  </td>
                  <td className="pa-table-mono">{new Date(u.creado_en).toLocaleDateString()}</td>
                  <td>
                    <div className="pa-usuarios-acciones">
                      <button
                        type="button"
                        className="pa-btn-secondary"
                        onClick={() => abrirModal(u)}
                      >
                        Editar
                      </button>
                      {u.id_usuario !== idActual && (
                        <button
                          type="button"
                          className="pa-btn-secondary"
                          disabled={eliminando !== null}
                          onClick={() => handleEliminar(u)}
                        >
                          {eliminando === u.id_usuario ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </td>
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