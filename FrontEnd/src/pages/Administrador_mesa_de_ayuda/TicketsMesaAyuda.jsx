// src/pages/mesa-ayuda/TicketsMesaAyuda.jsx
// Ruta: /mesa-ayuda/tickets
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import TicketDetailPanel from '../../components/TicketDetailPanel.jsx';
import { navItemsMesaAyuda } from './navItems.js';
import {
  listarTicketsAdministrador, listarEstadosTicket, editarTicket,
  registrarEntradaEquipo, obtenerUsuarioActual,
} from '../../services/adminService.js';

function TicketsMesaAyuda() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [estados, setEstados] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(null);

  async function cargar() {
    try {
      setCargando(true);
      const [t, es] = await Promise.all([listarTicketsAdministrador(), listarEstadosTicket()]);
      setTickets(t || []);
      setEstados(es || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const estadosDisponibles = ['Todos', ...new Set(tickets.map((t) => t.estado))];
  const filtered = filtro === 'Todos' ? tickets : tickets.filter((t) => t.estado === filtro);

  function buscarIdEstado(nombre) {
    return estados.find((es) => es.nombre_e.toLowerCase() === nombre.toLowerCase())?.id_estado;
  }

  async function handleRevertir(ticket) {
    if (!window.confirm('¿Estás seguro de revertir este ticket a "Pendiente"?')) return;
    
    setProcesando(ticket.id);
    try {
      await editarTicket(ticket.id, { id_estado: buscarIdEstado('Pendiente'), atendido: false });
      await cargar();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcesando(null);
    }
  }

  async function handleRegistrarEntrada(ticket) {
    setProcesando(ticket.id);
    try {
      const usuarioActual = obtenerUsuarioActual();
      await registrarEntradaEquipo(ticket.id, {
        id_estado_entregado: buscarIdEstado('Entregado en ambiente'),
        id_usuario_actual: usuarioActual?.id_usuario,
      });
      await cargar();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcesando(null);
    }
  }

  return (
    <PanelLayout title="Tickets" rol="administrador_mesa_ayuda" sidebarLabel="Mesa de Ayuda" navItems={navItemsMesaAyuda}>
      {seleccionado && <TicketDetailPanel ticket={seleccionado} onClose={() => setSeleccionado(null)} />}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Tickets</h1>
          <p className="pa-section-header__subtitle">Gestión y seguimiento de tickets del sistema</p>
        </div>
      </div>

      <div className="pa-filter-row" style={{ marginBottom: '24px' }}>
        {estadosDisponibles.map((f) => (
          <button 
            key={f} 
            className={`pa-filter-pill${filtro === f ? ' active' : ''}`} 
            onClick={() => setFiltro(f)} 
            type="button"
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: filtro === f ? '#45B3BF' : 'rgba(255,255,255,0.1)',
              color: filtro === f ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              fontWeight: filtro === f ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando tickets...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        <div className="pa-table-wrap" style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(69, 179, 191, 0.2)',
          overflow: 'hidden'
        }}>
          <table className="pa-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(69, 179, 191, 0.1)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#45B3BF', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#45B3BF', textTransform: 'uppercase' }}>Motivo</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#45B3BF', textTransform: 'uppercase' }}>Técnico</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#45B3BF', textTransform: 'uppercase' }}>Estado</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#45B3BF', textTransform: 'uppercase' }}>Fecha</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#45B3BF', textTransform: 'uppercase' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr 
                  key={t.id}
                  style={{ 
                    borderBottom: '1px solid rgba(69, 179, 191, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(69, 179, 191, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td 
                    className="pa-table-mono" 
                    style={{ 
                      padding: '16px 24px',
                      color: '#45B3BF',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer' 
                    }} 
                    onClick={() => setSeleccionado(t)}
                  >
                    #{t.id}
                  </td>
                  <td 
                    style={{ 
                      padding: '16px 24px',
                      fontSize: '14px',
                      color: '#fff',
                      fontWeight: 500,
                      cursor: 'pointer',
                      maxWidth: '300px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }} 
                    onClick={() => setSeleccionado(t)}
                    title={t.motivo || t.titulo}
                  >
                    {t.motivo || t.titulo}
                  </td>
                  <td style={{ 
                    padding: '16px 24px',
                    fontSize: '14px',
                    color: t.tecnico === 'Sin asignar' ? 'rgba(255,255,255,0.4)' : '#fff',
                    fontWeight: t.tecnico !== 'Sin asignar' ? 500 : 400
                  }}>
                    {t.tecnico || 'Sin asignar'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span 
                      className="pa-badge" 
                      style={{ 
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: `${t.estadoColor}26`, 
                        color: t.estadoColor, 
                        border: `1px solid ${t.estadoColor}4d` 
                      }}
                    >
                      {t.estado}
                    </span>
                  </td>
                  <td 
                    className="pa-table-mono" 
                    style={{ 
                      padding: '16px 24px',
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.7)'
                    }}
                  >
                    {t.fecha ? new Date(t.fecha).toLocaleDateString('es-ES') : '—'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {t.estado === 'Dado de baja' && (
                      <button 
                        className="pa-btn-secondary" 
                        style={{ 
                          padding: '6px 14px', 
                          fontSize: '12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          cursor: 'pointer'
                        }} 
                        disabled={procesando === t.id} 
                        onClick={() => handleRevertir(t)}
                      >
                        {procesando === t.id ? '...' : 'Revertir'}
                      </button>
                    )}
                    {t.estado !== 'Dado de baja' && !t.atendido && t.tecnico !== 'Sin asignar' && (
                      <button 
                        className="pa-btn-primary" 
                        style={{ 
                          padding: '6px 14px', 
                          fontSize: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#45B3BF',
                          color: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }} 
                        disabled={procesando === t.id} 
                        onClick={() => handleRegistrarEntrada(t)}
                      >
                        {procesando === t.id ? '...' : 'Registrar entrada'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="pa-empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <span className="pa-empty-state__icon" style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎫</span>
              <p className="pa-empty-state__title" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                No hay tickets para este filtro
              </p>
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
}

export default TicketsMesaAyuda;