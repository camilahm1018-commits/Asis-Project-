import { useState } from 'react';
import RegistrarEntradaModal from './RegistrarEntradaModal.jsx';

export default function RegistrarEntradaBoton({ ticket, onRegistrada, disabled = false }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  if (!ticket.puedeRegistrarEntrada) return null;

  return (
    <>
      <button
        type="button"
        className="pa-btn-primary"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setMostrarFormulario(true);
        }}
      >
        Registrar entrada
      </button>
      {mostrarFormulario && (
        <RegistrarEntradaModal
          ticket={ticket}
          onCancelar={() => setMostrarFormulario(false)}
          onRegistrada={async () => {
            setMostrarFormulario(false);
            await onRegistrada();
          }}
        />
      )}
    </>
  );
}
