// src/pages/instructor/MisTicketsInstructor.jsx
// Ruta: /instructor/mis-reportes
import { useEffect, useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import TicketDetailPanel from '../../components/TicketDetailPanel.jsx';
import EditarTicketPendienteModal from '../../components/EditarTicketPendienteModal.jsx';
import { navItemsInstructor } from './navItems.js';
import { listarTicketsAdministrador, obtenerUsuarioActual } from '../../services/adminService.js';

function MisTicketsInstructor() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState(null);
  const [editando, setEditando] = useState(null);
  const usuario = obtenerUsuarioActual();

  async function cargar() {
    try {
      setCargando(true);
      const data = await listarTicketsAdministrador();
      setTickets(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  // 🔍 DIAGNÓSTICO: Ver la estructura real que llega del backend
  if (tickets.length > 0) {
    console.log("🎫 ESTRUCTURA REAL DEL PRIMER TICKET:", tickets[0]);
  }

  // ✅ FILTRO CORREGIDO: Busca EXCLUSIVAMENTE el ID numérico, ignorando el nombre
  const misTickets = tickets.filter((t) => {
    // Usamos ?? para que tome el primer valor que NO sea null o undefined
    const idCreador = t.idCreadoPor ?? t.creado_por ?? t.id_creador;
    
    console.log(`Ticket #${t.id}: idCreador=${idCreador}, tu usuario=${usuario?.id_usuario}`);
    
    // Si no hay usuario logueado, mostramos todos (para depuración)
    if (!usuario?.id_usuario) return true;
    
    // Comparamos como strings para evitar errores de tipo (ej: 22 === "22")
    return String(idCreador) === String(usuario.id_usuario);
  });

  console.log("📋 Tickets filtrados (mis tickets):", misTickets);

  const estadosDisponibles = ['Todos', ...new Set(misTickets.map((t) => t.estado))];
  const filtered = filtro === 'Todos' ? misTickets : misTickets.filter((t) => t.estado === filtro);

  return (
    <PanelLayout title="Mis Reportes" rol="instructor" sidebarLabel="Instructor" navItems={navItemsInstructor}>
      {seleccionado && <TicketDetailPanel ticket={seleccionado} onClose={() => setSeleccionado(null)} />}
      {editando && (
        <EditarTicketPendienteModal
          ticket={editando}
          onClose={() => setEditando(null)}
          onGuardado={() => { setEditando(null); cargar(); }}
        />
      )}

      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Mis Reportes</h1>
          <p className="pa-section-header__subtitle">Fallas que has reportado al sistema — clic para ver el detalle</p>
        </div>
      </div>

      <div className="pa-filter-row">
        {estadosDisponibles.map((f) => (
          <button key={f} className={`pa-filter-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)} type="button">{f}</button>
        ))}
      </div>

      {cargando && <p className="pa-loading">Cargando tus reportes...</p>}
      {error && <p className="pa-error">{error}</p>}

      {!cargando && !error && (
        filtered.length === 0 ? (
          <div className="pa-card" style={{ padding: 64, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No hay reportes en esta categoría</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((t) => (
              <div key={t.id} className="pa-card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setSeleccionado(t)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="pa-table-mono" style={{ fontSize: 12, fontWeight: 700, color: '#45B3BF' }}>#{t.id}</span>
                    <span className="pa-badge" style={{ background: `${t.estadoColor}26`, color: t.estadoColor, borderColor: `${t.estadoColor}4d` }}>{t.estado}</span>
                  </div>
                  <span className="pa-table-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px', color: '#fff' }}>{t.titulo || t.motivo}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(27,112,166,0.15)' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>💻 {t.equipo || 'Sin equipo'}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      Técnico: <span style={{ color: t.tecnico === 'Sin asignar' ? '#f87171' : '#45B3BF' }}>{t.tecnico || 'Sin asignar'}</span>
                    </span>
                  </div>
                  {t.estado === 'Pendiente' && (
                    <button
                      type="button"
                      className="pa-btn-secondary"
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={(e) => { e.stopPropagation(); setEditando(t); }}
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </PanelLayout>
  );
}

export default MisTicketsInstructor;