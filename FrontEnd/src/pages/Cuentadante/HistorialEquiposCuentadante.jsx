// src/pages/cuentadante/HistorialEquiposCuentadante.jsx
// Ruta: /cuentadante/historial
//
// A diferencia del diseño de Figma (que mostraba una tabla con TODO
// el historial de todos los equipos con datos de ejemplo), tu backend
// expone el historial por equipo puntual:
// GET /dashboard/historial-equipo/{serial}. Por eso esta versión pide
// el serial y consulta ese equipo específico — es el mismo concepto,
// pero usando el endpoint que sí existe.
import { useState } from 'react';
import PanelLayout from '../../components/PanelLayout.jsx';
import { navItemsCuentadante } from './navItems.js';
import { obtenerHistorialEquipoPorSerial } from '../../services/adminService.js';

function HistorialEquiposCuentadante() {
  const [serial, setSerial] = useState('');
  const [historial, setHistorial] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);

  async function handleBuscar(e) {
    e.preventDefault();
    if (!serial.trim()) return;
    setBuscando(true);
    setError('');
    setBuscado(true);
    try {
      const data = await obtenerHistorialEquipoPorSerial(serial.trim());
      setHistorial(data);
    } catch (err) {
      setError(err.message);
      setHistorial(null);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <PanelLayout title="Historial Equipos" rol="cuentadante" sidebarLabel="Cuentadante" navItems={navItemsCuentadante}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Historial de Equipos</h1>
          <p className="pa-section-header__subtitle">Consulta el registro de novedades de un equipo por su serial</p>
        </div>
      </div>

      <form onSubmit={handleBuscar} style={{ display: 'flex', gap: 10, marginBottom: 24, maxWidth: 480 }}>
        <input
          className="pa-input"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="Buscar por serial del equipo..."
        />
        <button className="pa-btn-primary" type="submit" disabled={buscando || !serial.trim()}>
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && <p className="pa-error" style={{ textAlign: 'left', padding: 0 }}>{error}</p>}

      {!buscado && !error && (
        <div className="pa-empty-state">
          <span className="pa-empty-state__icon">🔍</span>
          <p className="pa-empty-state__title">Ingresa el serial de un equipo para ver su historial</p>
        </div>
      )}

      {buscado && !error && (
        Array.isArray(historial) && historial.length > 0 ? (
          <div className="pa-table-wrap">
            <table className="pa-table">
              <thead><tr><th>Fecha</th><th>Acción</th><th>Observación</th><th>Estado Resultante</th><th>Realizado por</th></tr></thead>
              <tbody>
                {historial.map((h, i) => (
                  <tr key={i}>
                    <td className="pa-table-mono">{h.fecha ? new Date(h.fecha).toLocaleString() : '—'}</td>
                    <td>
                      <span className="pa-badge" style={{
                        background: h.accion?.toLowerCase().includes('resuelto') ? 'rgba(74,222,128,0.15)' : 'rgba(69,179,191,0.15)',
                        color: h.accion?.toLowerCase().includes('resuelto') ? '#4ade80' : '#45B3BF',
                        borderColor: 'transparent',
                      }}>{h.accion}</span>
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 280 }}>{h.observacion || '—'}</td>
                    <td>{h.estado_resultante}</td>
                    <td>{h.realizado_por || h.id_usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pa-empty-state">
            <span className="pa-empty-state__icon">📋</span>
            <p className="pa-empty-state__title">No se encontró historial para ese serial</p>
          </div>
        )
      )}
    </PanelLayout>
  );
}

export default HistorialEquiposCuentadante;
