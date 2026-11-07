# ASIS — Proyecto completo alineado a los requisitos funcionales

Este paquete es mi proyecto completo (Backend + FrontEnd + base de
datos) con todos los cambios para que cumpla los 18 requisitos
funcionales del documento. Reemplaza tu carpeta actual por esta.

## 1. Antes de correrlo: la migración de base de datos

SQLModel solo crea tablas nuevas, no les agrega columnas a las que ya
existen. Por eso, antes de levantar el backend, corro esto UNA VEZ
contra mi base de datos:

```
base_de_datos/migracion_rf.sql
```

Agrega `usuarios.activo` (para el flujo de activación) y
`tickets.tipo_salida` (para clasificar daño/traslado/préstamo).

## 2. Variables de entorno para el correo (opcional)

Para que los correos de activación y recuperación se manden de
verdad, agrego esto a mi `.env` del Backend:

```
SMTP_HOST=smtp.midominio.com
SMTP_PORT=587
SMTP_USER=asis@midominio.com
SMTP_PASS=mi_clave
SMTP_FROM=asis@midominio.com
FRONTEND_URL=http://localhost:5173
```

Si no las configuro, el sistema sigue funcionando igual: el correo
que le tocaría llegar a la persona queda impreso en la consola del
backend, con el link completo, para poder seguir probando sin tener
un servidor SMTP real todavía.

## 3. Instalar y correr

```
cd Backend
pip install -r requierements_def.txt
uvicorn main:asis --reload

cd FrontEnd
npm install
npm run build   # ya lo probé, compila sin errores
npm run dev
```

## 4. Mapeo de los 18 requisitos funcionales

| RF | Qué pide | Dónde quedó |
|---|---|---|
| RF-001 a RF-005 | Menú/dashboard según el rol | Cada rol tiene su panel (`/administrador`, `/mesa-ayuda/panel`, `/tecnico`, `/instructor`, `/cuentadante`) |
| RF-002 | Cuentadante ve solo sus ambientes a cargo | Filtrado por `id_cuentadante` en Dashboard, Inventario, Ambientes y Reportes de Cuentadante |
| RF-003 | Técnico filtra por tipo de activo | Filtro agregado en `Tecnico/MisTicketsTecnico.jsx` |
| RF-006 | Registrar salida de equipo (daño/traslado/préstamo) | `SalidaEquipoForm.jsx`, usado por Instructor y Cuentadante |
| RF-007 | Registrar entrada de equipo | Botón "Registrar entrada" en Mesa de Ayuda y al marcar "atendido" en Técnico |
| RF-008 | Consultar tickets con filtros por rol | Cada "Mis Tickets" / "Tickets" ya filtra por estado y por rol |
| RF-009 | Editar ticket pendiente / revertir "Dado de baja" | `EditarTicketPendienteModal.jsx` (Instructor y Cuentadante) y botón "Revertir" en Mesa de Ayuda |
| RF-010 | Notificar cambios de estado | Se crea un registro en `notificaciones` en cada cambio relevante |
| RF-011 | Asignar y reasignar técnico | Pestañas "Sin asignar" / "Reasignar" en `AsignarTecnico.jsx` |
| RF-012 | Detalle e historial del ticket | `TicketDetailPanel.jsx` ahora trae el historial completo |
| RF-013 | Historial de un equipo por serial | `HistorialEquiposCuentadante.jsx` (busca por serial contra `/dashboard/historial-equipo/{serial}`) |
| RF-014 | Dashboard personalizado por rol | Ya lo tenía cada rol desde la entrega anterior |
| RF-015 | CRUD completo de ambientes | `AmbientesAdministrador.jsx`: crear, editar, eliminar y asignar cuentadante |
| RF-016 | Pre-registro + activación por correo | `Usuarios.pre-registrar`, `/auth/confirmar-datos`, `/auth/activar-cuenta`, páginas `Registrarse.jsx` y `ActivarCuenta.jsx` |
| RF-017 | Login seguro + cierre por inactividad | Login valida `activo`; `useAutoLogout` cierra sesión a los 15 min sin actividad |
| RF-018 | Recuperar contraseña por correo | `/auth/solicitar-recuperacion`, `/auth/restablecer-contrasena`, páginas `RecuperarContrasena.jsx` y `RestablecerContrasena.jsx` |

## 5. Decisiones que tomé por límites reales del sistema

- **RF-016**: no hay una base externa del SENA conectada, así que el
  "pre-registro" lo hace el administrador desde `/administrador/usuarios`
  (versión B del requisito). El usuario confirma sus datos y crea su
  contraseña con el link que le llega por correo.
- **RF-016 / RF-018 seguridad**: tanto "confirmar datos" como
  "solicitar recuperación" devuelven siempre el mismo mensaje, exista
  o no el usuario, para no filtrar qué correos/documentos están
  registrados. Si los datos no coinciden en la activación, les mando
  una alerta a los administradores por correo.
- **Colores de estado**: encontré que `estados_ticket.color` guarda
  nombres en español ("rojo", "azul"...), no códigos hex. Ya lo mapeo
  en `resolverColorEstado()` dentro de `adminService.js`.
- Sigo sin agregar autenticación (`Depends(verificar_token)`) a los
  endpoints de tickets/equipos/ambientes que ya venían sin ella desde
  antes de que yo entrara al proyecto — cambiar eso ahora es un
  refactor grande y riesgoso sin poder probarlo contra tu base de
  datos real, así que lo dejé igual que estaba.

## 6. Lo que ya venía de la entrega anterior (sigue igual)

Los 5 paneles por rol, el tema oscuro (`panelAdmin.css`), y el login
ya rediseñado. Esta entrega se monta sobre eso.
