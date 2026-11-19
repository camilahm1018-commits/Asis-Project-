// src/components/PerfilUsuario.jsx
// Contenido del perfil que se reutiliza en TODOS los roles.
// Cada página de perfil (PerfilAdministrador, PerfilMesaAyuda, etc.)
// solo se encarga del layout y de pasar el nombre del rol.
// Desde acá el usuario edita sus datos de contacto (formulario en modal)
// y pide el cambio de contraseña (le llega un enlace a su correo).
// Si la página pasa "children", se muestran debajo de la tarjeta (ej. las
// estadísticas del técnico).
import { useEffect, useState } from 'react';
import {
  obtenerMiPerfil,
  obtenerUsuarioActual,
  actualizarMiPerfil,
  solicitarCambioContrasena,
} from '../services/adminService.js';
import '../styles/perfil.css';

function formatearFecha(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? '—'
    : fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ej: "jperez@sena.edu.co" -> "jp*****@sena.edu.co"
function enmascararCorreo(correo) {
  if (!correo || !correo.includes('@')) return 'tu correo';
  const [usuario, dominio] = correo.split('@');
  return `${usuario.slice(0, 2)}${'*'.repeat(Math.max(usuario.length - 2, 1))}@${dominio}`;
}

function Fila({ etiqueta, valor, mono = false }) {
  return (
    <div className="perfil-fila">
      <span className="perfil-fila__etiqueta">{etiqueta}</span>
      <span className={`perfil-fila__valor${mono ? ' pa-table-mono' : ''}`}>
        {valor || '—'}
      </span>
    </div>
  );
}

function PerfilUsuario({ rolLabel, children }) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [perfil, setPerfil] = useState(null);
  const usuarioLocal = obtenerUsuarioActual();

  // Modal abierto: null | 'editar' | 'contrasena'
  const [modal, setModal] = useState(null);
  const [mensaje, setMensaje] = useState('');

  // Formulario de edición
  const [form, setForm] = useState({ nombre: '', apellidos: '', telefono: '' });
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cambio de contraseña por correo
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [mensajeCorreo, setMensajeCorreo] = useState('');
  const [errorCorreo, setErrorCorreo] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        setPerfil(await obtenerMiPerfil());
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  // El aviso de "perfil actualizado" se quita solo
  useEffect(() => {
    if (!mensaje) return undefined;
    const temporizador = setTimeout(() => setMensaje(''), 5000);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  // Si el backend todavía no respondió (o falló) se muestra lo que hay guardado del login
  const datos = perfil ?? usuarioLocal ?? {};
  const nombreCompleto = `${datos.nombre ?? ''} ${datos.apellidos ?? ''}`.trim();
  const iniciales = `${datos.nombre?.[0] ?? ''}${datos.apellidos?.[0] ?? ''}`.toUpperCase();
  const documento = datos.numero_documento
    ? `${datos.tipo_documento ? `${datos.tipo_documento} ` : ''}${datos.numero_documento}`
    : '';

  const hayCambios =
    form.nombre.trim() !== (datos.nombre ?? '') ||
    form.apellidos.trim() !== (datos.apellidos ?? '') ||
    form.telefono.trim() !== (datos.telefono ?? '');

  function abrirEditar() {
    setForm({
      nombre: datos.nombre ?? '',
      apellidos: datos.apellidos ?? '',
      telefono: datos.telefono ?? '',
    });
    setErrorForm('');
    setModal('editar');
  }

  function abrirContrasena() {
    setMensajeCorreo('');
    setErrorCorreo('');
    setModal('contrasena');
  }

  function cerrarModal() {
    if (guardando || enviandoCorreo) return;
    setModal(null);
  }

  function cambiarCampo(e) {
    setForm((anterior) => ({ ...anterior, [e.target.name]: e.target.value }));
  }

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');

    const nombre = form.nombre.trim();
    const apellidos = form.apellidos.trim();
    const telefono = form.telefono.replace(/[\s-]/g, '');

    if (!nombre) return setErrorForm('El nombre es obligatorio');
    if (!apellidos) return setErrorForm('Los apellidos son obligatorios');
    if (telefono && !/^\+?\d{7,15}$/.test(telefono)) {
      return setErrorForm('El teléfono debe tener entre 7 y 15 dígitos');
    }

    setGuardando(true);
    try {
      const actualizado = await actualizarMiPerfil({ nombre, apellidos, telefono });
      setPerfil(actualizado);

      // Mantengo el usuario guardado en el login al día y aviso a la barra superior
      const guardado = obtenerUsuarioActual();
      if (guardado) {
        localStorage.setItem(
          'usuario',
          JSON.stringify({ ...guardado, nombre: actualizado.nombre, apellidos: actualizado.apellidos })
        );
        window.dispatchEvent(new Event('usuario-actualizado'));
      }

      setModal(null);
      setMensaje('Tu perfil se actualizó correctamente.');
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function enviarCorreoContrasena() {
    setErrorCorreo('');
    setMensajeCorreo('');
    setEnviandoCorreo(true);
    try {
      const data = await solicitarCambioContrasena();
      setMensajeCorreo(data.mensaje);
    } catch (err) {
      setErrorCorreo(err.message);
    } finally {
      setEnviandoCorreo(false);
    }
  }

  return (
    <div className={`perfil-page${children ? ' perfil-page--extra' : ''}`}>
      <div className="perfil-encabezado">
        <h1 className="pa-section-header__title">Mi Perfil</h1>
        <p className="pa-section-header__subtitle">Información de tu cuenta</p>
      </div>

      {cargando && <p className="pa-loading">Cargando perfil...</p>}
      {error && <p className="pa-error">{error}</p>}
      {mensaje && <p className="perfil-aviso" role="status">✅ {mensaje}</p>}

      {!cargando && (
        <div className="perfil-card">
          <div className="perfil-card__banner" />
          <div className="perfil-avatar">{iniciales || '—'}</div>
          <div className="perfil-identidad">
            <p className="perfil-nombre">{nombreCompleto}</p>
            <span className="perfil-rol">{rolLabel}</span>
          </div>
          <div className="perfil-datos">
            <Fila etiqueta="Rol" valor={rolLabel} />
            <Fila etiqueta="Correo" valor={datos.correo} mono />
            <Fila etiqueta="Documento" valor={documento} mono />
            <Fila etiqueta="Teléfono" valor={datos.telefono} mono />
            <Fila etiqueta="Miembro desde" valor={formatearFecha(datos.creado_en)} />
          </div>
          <div className="perfil-acciones">
            <button type="button" className="pa-btn-primary" onClick={abrirEditar} disabled={!perfil}>
              ✏️ Editar perfil
            </button>
            <button type="button" className="pa-btn-secondary" onClick={abrirContrasena} disabled={!perfil}>
              🔒 Cambiar contraseña
            </button>
          </div>
        </div>
      )}

      {children}

      {/* ---------- MODAL: EDITAR PERFIL ---------- */}
      {modal === 'editar' && (
        <div className="pa-modal-overlay" onClick={cerrarModal}>
          <div className="pa-modal perfil-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pa-modal__header">
              <h2 className="pa-modal__title">Editar perfil</h2>
              <button className="pa-modal__close" onClick={cerrarModal} type="button">✕</button>
            </div>
            <form className="pa-modal__body" onSubmit={guardar} noValidate>
              {errorForm && <p className="perfil-error-form">{errorForm}</p>}

              <div className="pa-modal__row">
                <div className="pa-form-field">
                  <label htmlFor="perfil-nombre">Nombre</label>
                  <input
                    id="perfil-nombre"
                    name="nombre"
                    className="pa-input"
                    value={form.nombre}
                    onChange={cambiarCampo}
                    maxLength={50}
                    autoFocus
                    required
                  />
                </div>
                <div className="pa-form-field">
                  <label htmlFor="perfil-apellidos">Apellidos</label>
                  <input
                    id="perfil-apellidos"
                    name="apellidos"
                    className="pa-input"
                    value={form.apellidos}
                    onChange={cambiarCampo}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="pa-form-field">
                <label htmlFor="perfil-telefono">Teléfono</label>
                <input
                  id="perfil-telefono"
                  name="telefono"
                  type="tel"
                  inputMode="tel"
                  className="pa-input"
                  placeholder="Ej: 3001234567"
                  value={form.telefono}
                  onChange={cambiarCampo}
                  maxLength={20}
                />
              </div>

              <div className="pa-modal__row">
                <div className="pa-form-field">
                  <label htmlFor="perfil-correo">Correo</label>
                  <input id="perfil-correo" className="pa-input" value={datos.correo ?? ''} disabled readOnly />
                </div>
                <div className="pa-form-field">
                  <label htmlFor="perfil-documento">Documento</label>
                  <input id="perfil-documento" className="pa-input" value={documento} disabled readOnly />
                </div>
              </div>
              <p className="perfil-nota">
                El correo, el documento y el rol los gestiona el administrador del sistema.
              </p>

              <div className="pa-modal__actions">
                <button type="button" className="pa-btn-secondary" onClick={cerrarModal} disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" className="pa-btn-primary" disabled={guardando || !hayCambios}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- MODAL: CAMBIAR CONTRASEÑA (enlace por correo) ---------- */}
      {modal === 'contrasena' && (
        <div className="pa-modal-overlay" onClick={cerrarModal}>
          <div className="pa-modal perfil-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pa-modal__header">
              <h2 className="pa-modal__title">Cambiar contraseña</h2>
              <button className="pa-modal__close" onClick={cerrarModal} type="button">✕</button>
            </div>
            <div className="pa-modal__body">
              {mensajeCorreo ? (
                <>
                  <p className="perfil-aviso" role="status">✅ {mensajeCorreo}</p>
                  <p className="perfil-texto">
                    Revisa tu bandeja de entrada y, si no lo ves, la carpeta de spam.
                  </p>
                </>
              ) : (
                <p className="perfil-texto">
                  Por seguridad te enviaremos un enlace a <strong>{enmascararCorreo(datos.correo)}</strong> para
                  que crees una nueva contraseña. El enlace vence en 30 minutos.
                </p>
              )}
              {errorCorreo && <p className="perfil-error-form">{errorCorreo}</p>}

              <div className="pa-modal__actions">
                <button type="button" className="pa-btn-secondary" onClick={cerrarModal} disabled={enviandoCorreo}>
                  Cerrar
                </button>
                <button type="button" className="pa-btn-primary" onClick={enviarCorreoContrasena} disabled={enviandoCorreo}>
                  {enviandoCorreo ? 'Enviando...' : mensajeCorreo ? 'Reenviar enlace' : 'Enviar enlace'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerfilUsuario;
