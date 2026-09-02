# ASIS - React

Migración de los módulos de ASIS (autenticación, tickets y ambientes) de HTML/CSS/JS a React, usando **Vite** y **React Router**.

## Estructura del proyecto

```
proyecto-react/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── IMG/
│       ├── Imagen1.jpg     (logo ASIS)
│       ├── log.png         (ícono de login)
│       └── logoSena.png    (logo SENA, disponible por si lo necesitas)
└── src/
    ├── main.jsx
    ├── App.jsx              (todas las rutas de la app)
    ├── components/
    │   ├── Header.jsx       (header + nav de login/registro/recuperar)
    │   └── BarraSuperior.jsx (barra superior de tickets/ambientes)
    ├── pages/
    │   ├── Login.jsx
    │   ├── Registrarse.jsx
    │   ├── RecuperarContrasena.jsx
    │   ├── ConsultarTickets.jsx
    │   ├── RegistrarTicket.jsx
    │   ├── CambioEstadoTicket.jsx
    │   └── ConsultarAmbientes.jsx
    └── styles/
        ├── global.css
        ├── login.css
        ├── Registrarse.css
        ├── Recuperar_c.css
        ├── ticketsGlobal.css
        ├── Consultar_t.css
        ├── Registrar_t.css
        ├── Cambio_de_estado_tickets.css
        └── ambientes.css
```

## Rutas disponibles

| Ruta | Página |
|---|---|
| `/login` | Iniciar sesión |
| `/registrarse` | Registro de usuario |
| `/recuperar` | Recuperar contraseña |
| `/tickets/consultar` | Consultar tickets (filtros + panel de detalle) |
| `/tickets/registrar` | Registrar ticket de daño |
| `/tickets/cambiar-estado` | Cambio de estado de un ticket |
| `/ambientes` | Gestión de ambientes (filtros, panel de registro y modal de eliminar) |

## Cómo funciona

- **`Header.jsx`** reemplaza el `<header>` repetido en ambos HTML originales. Recibe `authTo` y `authLabel` como props para mostrar "Registrarse" en Login y "Iniciar sesión" en Registrarse, tal como en los archivos originales.
- El menú hamburguesa móvil ahora usa `useState` en vez de manipular el DOM directamente con `addEventListener`.
- **`Login.jsx`** conserva la misma llamada `fetch` a `http://127.0.0.1:8000/login` y la misma lógica de redirección según el rol (`data.rol`), solo que usa `useNavigate` de React Router en vez de `window.location.href`.
- **`Registrarse.jsx`** convierte el formulario a estado controlado de React (`useState` con un objeto `form`) y envía el `fetch` a `http://127.0.0.1:8000/registro_2` en formato JSON (el HTML original enviaba el formulario con `action`/`method` nativos; aquí se maneja todo por JS, igual que en Login).
- Las rutas están conectadas en `App.jsx`:
  - `/login` → página de inicio de sesión
  - `/registrarse` → página de registro
  - `/` redirige automáticamente a `/login`

## Cómo correrlo

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre el link que te muestra Vite (por defecto `http://localhost:5173`).

> Asegúrate de tener tu backend corriendo en `http://127.0.0.1:8000` para que el login y el registro funcionen, igual que en la versión original.

## Notas de la migración

- Los estilos se copiaron tal cual, sin modificar clases, para que el diseño se vea idéntico al original.
- Las imágenes se movieron a `public/IMG/` y las rutas en el código se ajustaron a `/IMG/...` (ruta pública de Vite), en vez de `../IMG/...`.
- Los enlaces entre páginas (`<a href="login.html">`, etc.) se reemplazaron por `<Link>` de React Router para navegación sin recargar la página. El botón "← Volver" ahora usa `navigate(-1)`.
- **Consultar tickets**: los datos de ejemplo (12 tickets ficticios) y toda la lógica de filtros, orden, búsqueda y el panel de detalle con historial de estados se migraron a `useState`/`useMemo`, replicando el comportamiento del script original.
- **Cambio de estado**: la tarjeta del ticket #001 sigue siendo un ejemplo estático (como en el HTML original); el botón "Guardar cambio" muestra la alerta de confirmación por 4 segundos.
- **Registrar ticket**: el `fetch` original hacía referencia a campos que no existían en el formulario (`id_estado`, `asignado_a`, `fecha_retorno`). Se ajustó el payload para enviar solo los campos que sí están en el formulario (`motivo`, `fecha_salida`, `id_equipo`, `id_ambiente`, `creado_por`).
- **Gestión de ambientes**: el HTML original cargaba un `ambientes.js` externo que no fue incluido entre tus archivos, así que reconstruí su comportamiento (abrir/cerrar el panel de registro, guardar un nuevo ambiente en la lista, abrir/cerrar el modal de confirmación y eliminar) directamente en React con `useState`. El botón "Editar" está presente en la interfaz pero, al no tener la lógica original, todavía no abre el panel prellenado — puedo agregarlo si me confirmas cómo debería comportarse.
- Falta por migrar (referenciadas pero no incluidas en los archivos que enviaste): `instructor.html`, `tecnico.html`, `admin.html`. Puedo agregarlas como páginas nuevas siguiendo el mismo patrón de `BarraSuperior` + página cuando me las compartas.
