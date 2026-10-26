
const URL_BACKEND = 'http://localhost:8000';

export default function ImagenTicket({ imagen }) {
  if (!imagen) return null;

  const rutaImagen = imagen.startsWith('http')
    ? imagen
    : `${URL_BACKEND}/${imagen.replace(/^\/+/, '')}`;

  return (
    <div style={{ margin: '12px 0' }}>
      <p style={{ color: '#45B3BF', fontWeight: 600 }}>
        📷 Imagen adjunta al ticket
      </p>

      <a href={rutaImagen} target="_blank" rel="noreferrer">
        <img
          src={rutaImagen}
          alt="Imagen del equipo"
          style={{
            width: 180,
            height: 120,
            objectFit: 'cover',
            borderRadius: 8,
            border: '1px solid #45B3BF',
            cursor: 'pointer',
          }}
        />
      </a>
    </div>
  );
}
