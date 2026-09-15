// src/pages/RegistrarTicketSimple.jsx
import { useEffect, useState } from 'react';
import PanelLayout from '../components/PanelLayout.jsx';
import { navItemsInstructor } from './instructor/navItems.js';
import { navItemsCuentadante } from './Cuentadante/navItems.js';
import {
  listarEquipos,
  listarMotivosNovedad,
  listarEstadosTicket,
  crearTicket,
  obtenerUsuarioActual,
} from '../services/adminService.js';

function RegistrarTicketSimple() {
  const usuario = obtenerUsuarioActual();
  const rol = usuario?.rol || 'instructor';
  const navItems = rol === 'cuentadante' ? navItemsCuentadante : navItemsInstructor;
  const tituloRol = rol === 'cuentadante' ? 'Cuentadante' : 'Instructor';

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [ticketCreado, setTicketCreado] = useState(null);

  const [equipos, setEquipos] = useState([]);
  const [motivosNovedad, setMotivosNovedad] = useState([]);
  const [estados, setEstados] = useState([]);

  const [idEquipo, setIdEquipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idMotivoNovedad, setIdMotivoNovedad] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const [e, mn, es] = await Promise.all([
          listarEquipos(),
          listarMotivosNovedad(),
          listarEstadosTicket(),
        ]);
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

  async function handleEnviar(e) {
    e.preventDefault();
    if (!idEquipo || !descripcion) {
      setErrorEnvio('Por favor, selecciona un equipo y describe el problema.');
      return;
    }

    setEnviando(true);
    setErrorEnvio('');

    try {
      // Buscar el estado "Pendiente" o usar el primero por defecto
      const estadoPendiente = estados.find(e => e.nombre_e.toLowerCase() === 'pendiente') || estados[0];

      const payload = {
        motivo: descripcion,
        fecha_salida: new Date().toISOString(),
        id_equipo: Number(idEquipo),
        id_estado: estadoPendiente?.id_estado,
        creado_por: usuario?.id_usuario,
        atendido: false,
        id_motivo_novedad: idMotivoNovedad ? Number(idMotivoNovedad) : null,
      };

      const respuesta = await crearTicket(payload);
      setTicketCreado(respuesta?.id_ticket || respuesta?.id || 'Generado');
      setEnviado(true);

      // Limpiar formulario
      setIdEquipo('');
      setDescripcion('');
      setIdMotivoNovedad('');

      // Volver al formulario después de 5 segundos
      setTimeout(() => {
        setEnviado(false);
        setTicketCreado(null);
      }, 5000);
    } catch (err) {
      setErrorEnvio(err.message || 'Ocurrió un error al registrar el ticket.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <PanelLayout title="Registrar Ticket" rol={rol} sidebarLabel={tituloRol} navItems={navItems}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 16px', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: 'rgba(74, 222, 128, 0.15)', border: '2px solid #4ade80', color: '#4ade80' }}>
            ✓
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>¡Ticket registrado!</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, textAlign: 'center' }}>
            Ticket <strong style={{ color: '#45B3BF' }}>#{ticketCreado}</strong> creado exitosamente en estado Pendiente.
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
            Serás redirigido al formulario en unos segundos...
          </p>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout title="Registrar Ticket" rol={rol} sidebarLabel={tituloRol} navItems={navItems}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Reportar Daño de Equipo</h1>
          <p className="pa-section-header__subtitle">Completa el formulario para registrar un nuevo ticket de soporte</p>
        </div>
      </div>

      {cargando && <p className="pa-loading">Cargando datos del inventario...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div style={{ maxWidth: 640 }}>
          <form onSubmit={handleEnviar} className="pa-card">
            <div className="pa-card__header">Nuevo Ticket</div>
            <div className="pa-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {errorEnvio && <p className="pa-error" style={{ padding: 0, textAlign: 'left' }}>{errorEnvio}</p>}

              <div className="pa-form-field">
                <label>Equipo afectado</label>
                <select
                  className="pa-select"
                  value={idEquipo}
                  onChange={(e) => setIdEquipo(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar equipo --</option>
                  {equipos.map((eq) => (
                    <option key={eq.id_equipo} value={eq.id_equipo}>
                      {eq.nombre} — {eq.codigo} (S/N: {eq.serial || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pa-form-field">
                <label>Descripción del problema</label>
                <textarea
                  className="pa-textarea"
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe con detalle la falla, cuándo comenzó y qué pasos has intentado..."
                  required
                />
              </div>

              <div className="pa-form-field">
                <label>Motivo de novedad (opcional)</label>
                <select
                  className="pa-select"
                  value={idMotivoNovedad}
                  onChange={(e) => setIdMotivoNovedad(e.target.value)}
                >
                  <option value="">-- Sin especificar --</option>
                  {motivosNovedad.map((m) => (
                    <option key={m.id_motivo} value={m.id_motivo}>{m.nombre_novedad}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="pa-btn-primary"
                style={{ width: '100%' }}
                disabled={!idEquipo || !descripcion || enviando}
              >
                {enviando ? 'Registrando...' : '📩 Registrar Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}
    </PanelLayout>
  );
}

export default RegistrarTicketSimple;