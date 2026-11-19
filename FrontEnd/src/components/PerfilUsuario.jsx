// src/components/PerfilUsuario.jsx
// Contenido del perfil que se reutiliza en TODOS los roles.
// Cada página de perfil (PerfilAdministrador, PerfilMesaAyuda, etc.)
// solo se encarga del layout y de pasar el nombre del rol.
import { useEffect, useState } from 'react';
import { obtenerMiPerfil, obtenerUsuarioActual } from '../services/adminService.js';

function formatearFecha(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? '—'
    : fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

function Fila({ etiqueta, valor, mono = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--pa-panel-soft)' }}>
      <span style={{ fontSize: 12, color: 'var(--pa-text-soft)' }}>{etiqueta}</span>
      <span className={mono ? 'pa-table-mono' : undefined} style={{ fontSize: 12, color: 'var(--pa-text)', textAlign: 'right', wordBreak: 'break-all' }}>
        {valor || '—'}
      </span>
    </div>
  );
}

function PerfilUsuario({ rolLabel }) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [perfil, setPerfil] = useState(null);
  const usuarioLocal = obtenerUsuarioActual();

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

  // Si el backend todavía no respondió (o falló) se muestra lo que hay guardado del login
  const datos = perfil ?? usuarioLocal ?? {};
  const nombreCompleto = `${datos.nombre ?? ''} ${datos.apellidos ?? ''}`.trim();
  const iniciales = `${datos.nombre?.[0] ?? ''}${datos.apellidos?.[0] ?? ''}`.toUpperCase();
  const documento = datos.numero_documento
    ? `${datos.tipo_documento ? `${datos.tipo_documento} ` : ''}${datos.numero_documento}`
    : '';

  return (
    <>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Mi Perfil</h1>
          <p className="pa-section-header__subtitle">Información de tu cuenta</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando perfil...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && (
        <div className="pa-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 480 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg, #1B70A6, #45B3BF)', color: '#fff',
          }}>
            {iniciales || '—'}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: 16, margin: 0, color: 'var(--pa-text)', fontFamily: "'DM Sans', sans-serif" }}>{nombreCompleto}</p>
            <p style={{ fontSize: 13, color: '#45B3BF', margin: '2px 0 0' }}>{rolLabel}</p>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Fila etiqueta="Rol" valor={rolLabel} />
            <Fila etiqueta="Correo" valor={datos.correo} mono />
            <Fila etiqueta="Documento" valor={documento} mono />
            <Fila etiqueta="Teléfono" valor={datos.telefono} mono />
            <Fila etiqueta="Miembro desde" valor={formatearFecha(datos.creado_en)} />
          </div>
        </div>
      )}
    </>
  );
}

export default PerfilUsuario;
