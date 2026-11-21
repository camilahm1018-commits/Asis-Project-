import { useId, useState } from 'react';
import { registrarEntradaEquipo } from '../services/adminService.js';

export default function RegistrarEntradaModal({ ticket, onCancelar, onRegistrada }) {
  const tituloId = useId();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function confirmar(e) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError('');
    try {
      await registrarEntradaEquipo(ticket.id);
      await onRegistrada();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="pa-modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div
        className="pa-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !guardando) onCancelar();
        }}
      >
        <div className="pa-modal__header">
          <h2 id={tituloId} className="pa-modal__title">Registrar entrada — #{ticket.id}</h2>
        </div>
        <form onSubmit={confirmar}>
          <div className="pa-modal__body">
            <p>Confirma que el equipo ya fue devuelto al ambiente.</p>
            <p><strong>{ticket.equipo}</strong> · {ticket.ambiente}</p>
            {error && <p className="pa-error" role="alert">{error}</p>}
            <div className="pa-modal__actions">
              <button type="button" className="pa-btn-secondary" disabled={guardando} onClick={onCancelar} autoFocus>
                Cancelar
              </button>
              <button type="submit" className="pa-btn-primary" disabled={guardando}>
                {guardando ? 'Registrando...' : 'Confirmar entrada'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
