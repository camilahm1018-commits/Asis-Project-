// src/pages/mesa-ayuda/AsignarTecnico.jsx
// Ruta: /mesa-ayuda/asignar
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsMesaAyuda } from './navItems.js';
import {
  listarTicketsAdministrador, listarTecnicos, asignarTecnicoATicket, obtenerUsuarioActual,
} from '../../services/adminService.js';

function AsignarTecnico() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [ticketSel, setTicketSel] = useState(null);
  const [tecnicoSel, setTecnicoSel] = useState(null);
  const [asignando, setAsignando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorAsignar, setErrorAsignar] = useState('');

  async function cargar() {
    try {
      setCargando(true);
      const [t, tec] = await Promise.all([listarTicketsAdministrador(), listarTecnicos()]);
      setTickets(t);
      setTecnicos(tec || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const sinAsignar = tickets.filter((t) => t.tecnico === 'Sin asignar');

  async function handleAsignar() {
    if (!ticketSel || !tecnicoSel) return;
    setAsignando(true);
    setErrorAsignar('');
    try {
      const usuarioActual = obtenerUsuarioActual();
      await asignarTecnicoATicket(ticketSel.id, tecnicoSel.id_usuario, usuarioActual?.id_usuario);
      setMensaje(`${tecnicoSel.nombre_u} fue asignado al ticket #${ticketSel.id}`);
      setTicketSel(null);
      setTecnicoSel(null);
      cargar();
    } catch (err) {
      setErrorAsignar(err.message);
    } finally {
      setAsignando(false);
    }
  }

  return (
    <PanelLayout title="Asignar Técnico" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Asignar Técnico</h1>
          <p className="pa-section-header__subtitle">Asigna técnicos a tickets pendientes</p>
        </div>
      </div>

      {mensaje && <div className="pa-banner-success"><span>✓</span><span>{mensaje}</span></div>}
      {errorAsignar && <p className="pa-error" style={{ textAlign: 'left', padding: 0, marginBottom: 16 }}>{errorAsignar}</p>}
      {cargando && <p className="pa-loading">Cargando...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-grid-2">
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#45B3BF', marginBottom: 12 }}>
              Tickets sin asignar ({sinAsignar.length})
            </h3>
            {sinAsignar.length === 0 ? (
              <div className="pa-card" style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Todos los tickets han sido asignados ✓</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sinAsignar.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`pa-select-card${ticketSel?.id === t.id ? ' selected' : ''}`}
                    onClick={() => setTicketSel(t)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="pa-table-mono" style={{ fontSize: 11, color: '#45B3BF' }}>#{t.id}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{t.titulo}</p>
                    <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>{t.ambiente}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#45B3BF', marginBottom: 12 }}>Técnicos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {tecnicos.map((tec) => (
                <button
                  key={tec.id_usuario}
                  type="button"
                  className={`pa-select-card pa-select-card--tecnico${tecnicoSel?.id_usuario === tec.id_usuario ? ' selected' : ''}`}
                  onClick={() => setTecnicoSel(tec)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  <span className="pa-avatar pa-avatar--lg">{`${tec.nombre_u[0]}${tec.apellidos_u[0]}`.toUpperCase()}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#fff' }}>{tec.nombre_u} {tec.apellidos_u}</p>
                    <p style={{ fontSize: 12, margin: '2px 0 0', color: 'rgba(255,255,255,0.5)' }}>{tec.correo_u}</p>
                  </div>
                </button>
              ))}
              {tecnicos.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No hay técnicos registrados.</p>}
            </div>
            <button
              className="pa-btn-primary"
              style={{ width: '100%' }}
              disabled={!ticketSel || !tecnicoSel || asignando}
              onClick={handleAsignar}
              type="button"
            >
              {asignando
                ? 'Asignando...'
                : ticketSel && tecnicoSel
                  ? `Asignar ${tecnicoSel.nombre_u} → #${ticketSel.id}`
                  : 'Selecciona un ticket y un técnico'}
            </button>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}

export default AsignarTecnico;
