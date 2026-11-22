// src/pages/HistorialGeneralEquipos.jsx
// Historial de todos los equipos (solo lectura), compartido por los roles.
import { useEffect, useState } from 'react';
import PanelLayout from '../components/PanelLayout.jsx';
import { obtenerHistorialGeneral } from '../services/adminService.js';

const POR_PAGINA = 20;

function HistorialGeneralEquipos({ rol, sidebarLabel, navItems }) {
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState('');
  const [offset, setOffset] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const data = await obtenerHistorialGeneral({ buscar: filtro, limit: POR_PAGINA, offset });
        if (!cancelado) setHistorial(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelado) {
          setError(err.message);
          setHistorial([]);
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [filtro, offset]);

  function handleBuscar(e) {
    e.preventDefault();
    setOffset(0);
    setFiltro(buscar.trim());
  }

  const mostrarResponsable = historial.some((h) => h.realizado_por);
  const hayMas = historial.length === POR_PAGINA;
  const pagina = Math.floor(offset / POR_PAGINA) + 1;

  return (
    <PanelLayout title="Historial de Equipos" rol={rol} sidebarLabel={sidebarLabel} navItems={navItems}>
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Historial General de Equipos</h1>
          <p className="pa-section-header__subtitle">Registro de novedades de todos los equipos</p>
        </div>
      </div>

      <form onSubmit={handleBuscar} style={{ display: 'flex', gap: 10, marginBottom: 24, maxWidth: 480 }}>
        <input
          className="pa-input"
          aria-label="Buscar en el historial"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por serial, equipo o código..."
        />
        <button className="pa-btn-primary" type="submit" disabled={cargando}>Buscar</button>
      </form>

      {error && <p className="pa-error" style={{ textAlign: 'left', padding: 0 }}>{error}</p>}
      {cargando && <p className="pa-loading">Cargando historial...</p>}

      {!cargando && !error && (
        historial.length > 0 ? (
          <>
            <div className="pa-table-wrap">
              <table className="pa-table">
                <thead>
                  <tr>
                    <th>Fecha</th><th>Equipo</th><th>Serial</th><th>Acción</th>
                    <th>Observación</th><th>Estado Resultante</th>
                    {mostrarResponsable && <th>Realizado por</th>}
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h, i) => {
                    const resuelto = h.accion?.toLowerCase().includes('resuelto');
                    return (
                      <tr key={`${h.serial}-${h.fecha}-${i}`}>
                        <td className="pa-table-mono">{h.fecha ? new Date(h.fecha).toLocaleString() : '—'}</td>
                        <td>{h.equipo || '—'}</td>
                        <td className="pa-table-mono">{h.serial}</td>
                        <td>
                          <span className="pa-badge" style={{
                            background: resuelto ? 'rgba(74,222,128,0.15)' : 'rgba(69,179,191,0.15)',
                            color: resuelto ? '#4ade80' : '#45B3BF',
                            borderColor: 'transparent',
                          }}>{h.accion}</span>
                        </td>
                        <td style={{ fontSize: 12, maxWidth: 280 }}>{h.observacion || '—'}</td>
                        <td>{h.estado_resultante}</td>
                        {mostrarResponsable && <td>{h.realizado_por || '—'}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
              <button className="pa-btn-secondary" type="button" disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - POR_PAGINA))}>← Anterior</button>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Página {pagina}</span>
              <button className="pa-btn-secondary" type="button" disabled={!hayMas}
                onClick={() => setOffset(offset + POR_PAGINA)}>Siguiente →</button>
            </div>
          </>
        ) : (
          <div className="pa-empty-state">
            <span className="pa-empty-state__icon"></span>
            <p className="pa-empty-state__title">No hay registros en el historial</p>
          </div>
        )
      )}
    </PanelLayout>
  );
}

export default HistorialGeneralEquipos;