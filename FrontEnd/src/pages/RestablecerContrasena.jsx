import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  async function handleRestablecer(e) {e.preventDefault();setError('');setExito(false);

    // Validaciones
    if (!token) {setError('El token es requerido');
      return;
    }
    if (nuevaContrasena.length < 6) {setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    try {
      const response = await fetch('http://localhost:8000/auth/restablecer-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',},
        body: JSON.stringify({token: token,nueva_contrasena: nuevaContrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al restablecer la contraseña');
      }

      setExito(true);
      setTimeout(() => {navigate('/login');}, 3000);} catch (err) {setError(err.message)} finally {setCargando(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          Restablecer Contraseña
        </h1>
        
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          Ingresa el token y tu nueva contraseña
        </p>

        {exito && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid #4ade80',
            borderRadius: '8px',
            color: '#4ade80',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            ✅ Contraseña actualizada. Redirigiendo al login...
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(248, 113, 113, 0.15)',
            border: '1px solid #f87171',
            borderRadius: '8px',
            color: '#f87171',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleRestablecer}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#45B3BF',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Token de Recuperación
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
              disabled={exito}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '6px'
            }}>
              💡 Revisa los logs del backend para obtener el token
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#45B3BF',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              placeholder="••••••••"
              required
              disabled={exito}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#45B3BF',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              placeholder="••••••••"
              required
              disabled={exito}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={cargando || exito}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: exito ? '#4ade80' : '#45B3BF',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: cargando || exito ? 'not-allowed' : 'pointer',
              opacity: cargando || exito ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {cargando ? 'Procesando...' : exito ? '¡Contraseña Actualizada!' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Cancelar y volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default RestablecerContrasena;