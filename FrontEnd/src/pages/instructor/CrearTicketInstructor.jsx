// src/pages/instructor/CrearTicketInstructor.jsx
// Ruta: /instructor/reportar
//
// NOTA: el diseño de Figma incluía "Prioridad" y "Tipo de daño" como
// campos del formulario, pero el modelo Tickets del backend todavía no
// tiene esas columnas (solo: motivo, id_equipo, id_motivo_novedad,
// id_estado, creado_por, asignado_a, fechas, atendido). Por eso este
// formulario se ajustó a los campos que sí existen. Si más adelante
// agregas prioridad/tipo_dano a la tabla, se pueden reincorporar aquí
// siguiendo el mismo patrón.
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsInstructor } from './navItems.js';
import {
  listarEquipos, listarMotivosNovedad, listarEstadosTicket, crearTicket, obtenerUsuarioActual,
} from '../../services/adminService.js';

function CrearTicketInstructor() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [motivosNovedad, setMotivosNovedad] = useState([]);
  const [estados, setEstados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  const [equipoId, setEquipoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [idMotivoNovedad, setIdMotivoNovedad] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const [e, mn, es] = await Promise.all([listarEquipos(), listarMotivosNovedad(), listarEstadosTicket()]);
        setEquipos(e || []);
        setMotivosNovedad(mn || []);
        setEstados(es || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const equipoElegido = equipos.find((e) => String(e.id_equipo) === equipoId);

  async function handleEnviar(e) {
    e.preventDefault();
    if (!equipoId || !motivo) return;
    setEnviando(true);
    setErrorEnvio('');
    try {
      const usuarioActual = obtenerUsuarioActual();
      // Estado inicial: se usa el primero de la lista (normalmente
      // "Abierto" / "Pendiente"). Ajusta este criterio si tu tabla
      // estados_ticket usa otro orden.
      const estadoInicial = estados[0];
      await crearTicket({
        motivo,
        id_equipo: Number(equipoId),
        id_motivo_novedad: idMotivoNovedad ? Number(idMotivoNovedad) : null,
        id_estado: estadoInicial?.id_estado,
        creado_por: usuarioActual?.id_usuario,
        atendido: false,
      });
      setEnviado(true);
      setEquipoId(''); setMotivo(''); setIdMotivoNovedad('');
      setTimeout(() => setEnviado(false), 4000);
    } catch (err) {
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <PanelLayout title="Reportar Falla" rol="instructor" sidebarLabel="Instructor" navItems={navItemsInstructor}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 16px', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: 'rgba(69,179,191,0.15)', border: '1px solid rgba(69,179,191,0.4)' }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Reporte enviado exitosamente</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>El equipo de Mesa de Ayuda recibirá tu reporte y asignará un técnico.</p>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout title="Reportar Falla" rol="instructor" sidebarLabel="Instructor" navItems={navItemsInstructor}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Reportar </h1>
          <p className="pa-section-header__subtitle">Completa el formulario para reportar un problema técnico</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando formulario...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div style={{ maxWidth: 640 }}>
          <form onSubmit={handleEnviar} className="pa-card">
            <div className="pa-card__header">Nuevo Reporte de Falla</div>
            <div className="pa-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {errorEnvio && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{errorEnvio}</p>}

              <div className="pa-form-field">
                <label>Equipo afectado</label>
                <select className="pa-select" value={equipoId} onChange={(e) => setEquipoId(e.target.value)} required>
                  <option value="">Seleccionar equipo...</option>
                  {equipos.map((eq) => (
                    <option key={eq.id_equipo} value={eq.id_equipo}>{eq.nombre} — {eq.codigo}</option>
                  ))}
                </select>
              </div>

              {equipoElegido && (
                <div className="pa-detail-block" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#45B3BF' }}>💻</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, margin: 0, color: 'rgba(255,255,255,0.8)' }}>{equipoElegido.nombre}</p>
                    <p style={{ fontSize: 11, margin: 0, color: 'rgba(255,255,255,0.4)' }}>S/N {equipoElegido.serial || '—'}</p>
                  </div>
                </div>
              )}

              <div className="pa-form-field">
                <label>Descripción del problema</label>
                <textarea className="pa-textarea" rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describe con detalle qué ocurre, cuándo comenzó y qué pasos has intentado..." required />
              </div>

              <div className="pa-form-field">
                <label>Motivo de novedad (opcional)</label>
                <select className="pa-select" value={idMotivoNovedad} onChange={(e) => setIdMotivoNovedad(e.target.value)}>
                  <option value="">Sin especificar</option>
                  {motivosNovedad.map((m) => (
                    <option key={m.id_motivo} value={m.id_motivo}>{m.nombre_novedad}</option>
                  ))}
                </select>
              </div>

              <div>
                <button type="submit" className="pa-btn-primary" style={{ width: '100%' }} disabled={!equipoId || !motivo || enviando}>
                  {enviando ? 'Enviando...' : '📩 Enviar Reporte de Falla'}
                </button>
                {(!equipoId || !motivo) && (
                  <p style={{ fontSize: 11, textAlign: 'center', marginTop: 8, color: 'rgba(255,255,255,0.35)' }}>
                    Completa el equipo y la descripción para enviar
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </PanelLayout>
  );
}

export default CrearTicketInstructor;
