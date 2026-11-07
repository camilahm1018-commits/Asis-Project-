// src/pages/ConfiguracionAdministrador.jsx
// Ruta: /administrador/configuracion
//
// Igual que en el diseño de Figma, esta sección es mayormente
// informativa/estática. Los valores están de ejemplo — cuando tengas
// un endpoint de configuración en el backend (por ejemplo
// GET /configuracion) reemplaza el arreglo `secciones` por datos
// reales en un useEffect, siguiendo el mismo patrón que las otras
// páginas de este panel.
import AdminLayout from '../../components/AdminLayout.jsx';

const secciones = [
  {
    title: 'Información del Sistema',
    items: [
      { label: 'Nombre del sistema', value: 'ASIS — Sistema de Gestión de Tickets' },
      { label: 'Centro de formación', value: 'SENA' },
      { label: 'Versión', value: '1.0.0' },
    ],
  },
  {
    title: 'Notificaciones',
    items: [
      { label: 'Canal de notificaciones', value: 'Correo electrónico' },
      { label: 'Notificar al asignar técnico', value: 'Activado' },
      { label: 'Notificar al cerrar ticket', value: 'Activado' },
    ],
  },
  {
    title: 'Seguridad',
    items: [
      { label: 'Autenticación', value: 'Correo @sena.edu.co' },
      { label: 'Cifrado de contraseñas', value: 'bcrypt' },
    ],
  },
  {
    title: 'Base de Datos',
    items: [
      { label: 'Motor', value: 'MySQL / SQLModel' },
      { label: 'Backend', value: 'FastAPI' },
      { label: 'Estado de conexión', value: '✓ Activa' },
    ],
  },
];

function ConfiguracionAdministrador() {
  return (
    <AdminLayout title="Configuración">
      <div className="pa-section-header">
        <div>
          <h1 className="pa-section-header__title">Configuración del Sistema</h1>
          <p className="pa-section-header__subtitle">Parámetros globales de ASIS</p>
        </div>
      </div>

      <div className="pa-grid-2">
        {secciones.map((sec) => (
          <div key={sec.title} className="pa-card">
            <div className="pa-card__header">{sec.title}</div>
            <div className="pa-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sec.items.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#45B3BF' }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'right' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default ConfiguracionAdministrador;
