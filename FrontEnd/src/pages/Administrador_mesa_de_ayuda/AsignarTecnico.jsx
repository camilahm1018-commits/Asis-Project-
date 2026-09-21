// src/pages/mesa-ayuda/AsignarTecnico.jsx
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsMesaAyuda } from './navItems.js';
import {
  listarTicketsAdministrador, 
  listarTecnicos, 
  asignarTecnicoATicket, 
  reasignarTecnico, 
  desasignarTecnico,
  obtenerUsuarioActual,
} from '../../services/adminService.js';

function AsignarTecnico() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [modo, setModo] = useState('nuevos'); // 'nuevos' | 'reasignar' | 'desasignar'
  const [ticketSel, setTicketSel] = useState(null);
  const [tecnicoSel, setTecnicoSel] = useState(null);
  const [asignando, setAsignando] = useState(false);
  const [desasignando, setDesasignando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorAsignar, setErrorAsignar] = useState('');

  async function cargar() {
    try {
      setCargando(true);
      const [t, tec] = await Promise.all([listarTicketsAdministrador(), listarTecnicos()]);
      setTickets(t || []);
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

  const sinAsignar = tickets.filter((t) => t.tecnico === 'Sin asignar' || !t.tecnico);
  const yaAsignados = tickets.filter((t) => t.tecnico !== 'Sin asignar' && t.tecnico && !t.atendido);
  
  // Determinar qué lista mostrar según el modo
  const listaTickets = modo === 'nuevos' ? sinAsignar : yaAsignados;

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setTicketSel(null);
    setTecnicoSel(null);
    setMensaje('');
    setErrorAsignar('');
  }

  async function handleAsignar() {
    if (!ticketSel || !tecnicoSel) return;
    setAsignando(true);
    setErrorAsignar('');
    try {
      const usuarioActual = obtenerUsuarioActual();

      if (modo === 'nuevos') {
        await asignarTecnicoATicket(ticketSel.id, tecnicoSel.id_usuario, usuarioActual?.id_usuario);
        setMensaje(`${tecnicoSel.nombre_u} fue asignado al ticket #${ticketSel.id}`);
      } else if (modo === 'reasignar') {
        await reasignarTecnico(ticketSel.id, tecnicoSel.id_usuario, usuarioActual?.id_usuario);
        setMensaje(`El ticket #${ticketSel.id} fue reasignado a ${tecnicoSel.nombre_u}`);
      }

      setTicketSel(null);
      setTecnicoSel(null);
      cargar();
    } catch (err) {
      setErrorAsignar(err.message);
    } finally {
      setAsignando(false);
    }
  }

  async function handleDesasignar() {
    if (!ticketSel) return;
    
    if (!window.confirm(`¿Estás seguro de desasignar al técnico del ticket #${ticketSel.id}?\n\nEl ticket volverá a la cola de "Sin asignar".`)) {
      return;
    }

    setDesasignando(true);
    setErrorAsignar('');
    
    try {
      await desasignarTecnico(ticketSel.id);
      setMensaje(`El ticket #${ticketSel.id} fue desasignado y devuelto a la cola.`);
      
      setTicketSel(null);
      cargar(); 
    } catch (err) {
      setErrorAsignar(err.message);
    } finally {
      setDesasignando(false);
    }
  }

  return (
    <PanelLayout title="Asignar Técnico" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Gestión de Técnicos</h1>
          <p className="pa-section-header__subtitle">Asigna, reasigna o desasigna técnicos de los tickets</p>
        </div>
      </div>

      {/* ✅ TRES PESTAÑAS: Sin asignar | Reasignar | Desasignar */}
      <div className="pa-filter-row" style={{ marginBottom: '24px' }}>
        <button 
          className={`pa-filter-pill${modo === 'nuevos' ? ' active' : ''}`} 
          onClick={() => cambiarModo('nuevos')} 
          type="button"
        >
          Sin asignar ({sinAsignar.length})
        </button>
        <button 
          className={`pa-filter-pill${modo === 'reasignar' ? ' active' : ''}`} 
          onClick={() => cambiarModo('reasignar')} 
          type="button"
        >
          Reasignar ({yaAsignados.length})
        </button>
        <button 
          className={`pa-filter-pill${modo === 'desasignar' ? ' active' : ''}`} 
          onClick={() => cambiarModo('desasignar')} 
          type="button"
          style={{ background: modo === 'desasignar' ? '#ef4444' : undefined }}
        >
          🚫 Desasignar ({yaAsignados.length})
        </button>
      </div>

      {mensaje && <div className="pa-banner-success" style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ade80', color: '#4ade80', marginBottom: 16, display: 'flex', gap: 8 }}><span>✓</span><span>{mensaje}</span></div>}
      {errorAsignar && <p className="pa-error" style={{ textAlign: 'left', padding: 0, marginBottom: 16 }}>{errorAsignar}</p>}
      {cargando && <p className="pa-loading">Cargando...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-grid-2" style={{ display: 'grid', gridTemplateColumns: modo === 'desasignar' ? '1fr' : '1fr 1fr', gap: '24px' }}>
          
          {/* Columna de Tickets (Siempre visible) */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#45B3BF', marginBottom: 16 }}>
              {modo === 'nuevos' && `Tickets sin asignar (${listaTickets.length})`}
              {modo === 'reasignar' && `Tickets ya asignados (${listaTickets.length})`}
              {modo === 'desasignar' && `Tickets para desasignar (${listaTickets.length})`}
            </h3>
            {listaTickets.length === 0 ? (
              <div className="pa-card" style={{ padding: 40, textAlign: 'center', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  {modo === 'nuevos' && 'Todos los tickets nuevos han sido asignados ✓'}
                  {modo === 'reasignar' && 'No hay tickets activos con técnico asignado.'}
                  {modo === 'desasignar' && 'No hay tickets disponibles para desasignar.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {listaTickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`pa-select-card${ticketSel?.id === t.id ? ' selected' : ''}`}
                    onClick={() => setTicketSel(t)}
                    style={{ 
                      borderRadius: '12px', 
                      textAlign: 'left',
                      padding: '16px 20px',
                      background: ticketSel?.id === t.id ? 'rgba(69, 179, 191, 0.15)' : 'rgba(255,255,255,0.95)',
                      transition: 'all 0.2s ease',
                      border: ticketSel?.id === t.id ? '2px solid #45B3BF' : '2px solid transparent',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      color: '#1a1a1a'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ 
                        fontSize: 14, 
                        fontWeight: 700, 
                        color: '#45B3BF',
                        background: 'rgba(69, 179, 191, 0.1)',
                        padding: '4px 12px',
                        borderRadius: '6px'
                      }}>
                        #{t.id}
                      </span>
                      {(modo === 'reasignar' || modo === 'desasignar') && (
                        <span style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                          técnico: {t.tecnico}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                      {t.motivo || t.titulo}
                    </p>
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                      {t.ambiente || 'Ambiente no especificado'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna de Técnicos (SOLO en modos 'nuevos' y 'reasignar') */}
          {modo !== 'desasignar' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#45B3BF', marginBottom: 16 }}>
                {modo === 'nuevos' ? 'Técnico a asignar' : 'Nuevo técnico'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {tecnicos.map((tec) => (
                  <button
                    key={tec.id_usuario}
                    type="button"
                    className={`pa-select-card pa-select-card--tecnico${tecnicoSel?.id_usuario === tec.id_usuario ? ' selected' : ''}`}
                    onClick={() => setTecnicoSel(tec)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 16,
                      borderRadius: '12px',
                      padding: '14px 20px',
                      background: tecnicoSel?.id_usuario === tec.id_usuario ? 'rgba(69, 179, 191, 0.15)' : 'rgba(255,255,255,0.95)',
                      border: tecnicoSel?.id_usuario === tec.id_usuario ? '2px solid #45B3BF' : '2px solid transparent',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      color: '#1a1a1a'
                    }}
                  >
                    <span style={{
                      width: '48px',
                      height: '48px',
                      fontSize: '18px',
                      fontWeight: 600,
                      background: '#45B3BF',
                      color: '#fff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {`${tec.nombre_u?.[0] || ''}${tec.apellidos_u?.[0] || ''}`.toUpperCase()}
                    </span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
                        {tec.nombre_u} {tec.apellidos_u}
                      </p>
                      <p style={{ fontSize: 13, margin: '4px 0 0', color: '#666' }}>
                        {tec.correo_u}
                      </p>
                    </div>
                  </button>
                ))} 
                {tecnicos.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', padding: 20 }}>
                    No hay técnicos registrados en el sistema.
                  </p>
                )}
              </div>

              {/* Botón Asignar/Reasignar */}
              <button
                className="pa-btn-primary"
                style={{ 
                  width: '100%', 
                  borderRadius: '12px',
                  padding: '14px 24px',
                  fontSize: 15,
                  fontWeight: 600,
                  background: (!ticketSel || !tecnicoSel) ? '#6c757d' : '#45B3BF',
                  transition: 'all 0.2s ease',
                  cursor: (!ticketSel || !tecnicoSel) ? 'not-allowed' : 'pointer',
                  color: 'white',
                  border: 'none'
                }}
                disabled={!ticketSel || !tecnicoSel || asignando}
                onClick={handleAsignar}
                type="button"
              >
                {asignando
                  ? 'Guardando...'
                  : ticketSel && tecnicoSel
                    ? `${modo === 'nuevos' ? 'Asignar' : 'Reasignar'} ${tecnicoSel.nombre_u} → #${ticketSel.id}`
                    : 'Selecciona un ticket y un técnico'}
              </button>
            </div>
          )}

          {/* ✅ MODO DESASIGNAR: Solo muestra el botón rojo cuando hay ticket seleccionado */}
          {modo === 'desasignar' && ticketSel && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              padding: '40px 20px',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '12px',
              border: '2px dashed rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>️</span>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#ef4444', margin: '0 0 8px 0' }}>
                  Desasignar Técnico
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  Ticket seleccionado: <strong style={{ color: '#45B3BF' }}>#{ticketSel.id}</strong>
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '8px 0 0 0' }}>
                  Técnico actual: <strong>{ticketSel.tecnico}</strong>
                </p>
              </div>
              
              <button
                className="pa-btn-secondary"
                style={{ 
                  width: '100%', 
                  borderRadius: '12px',
                  padding: '16px 24px',
                  fontSize: 16,
                  fontWeight: 600,
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  cursor: desasignando ? 'not-allowed' : 'pointer',
                  opacity: desasignando ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.2s ease'
                }}
                disabled={desasignando}
                onClick={handleDesasignar}
                type="button"
              >
                {desasignando ? 'Procesando...' : '🚫 Desasignar Técnico (Devolver a cola)'}
              </button>
              
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 16, margin: '16px 0 0 0' }}>
                El ticket volverá a estar disponible para cualquier técnico
              </p>
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
}

export default AsignarTecnico;