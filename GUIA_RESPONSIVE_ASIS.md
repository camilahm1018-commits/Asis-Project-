# ASIS · Ajustes responsive (versión del 24 de noviembre de 2026)

## Alcance

Se modificó **únicamente el FrontEnd** de la versión entregada en `Asis-Project-(6).zip`.
No se cambiaron rutas de API, permisos, servicios, scripts SQL, contraseñas, modelos ni despliegue de Railway.
La apariencia conserva las variables de los temas claro y oscuro de ASIS.

## Cambios realizados

- **Archivo nuevo:** `FrontEnd/src/styles/responsive.css`, cargado desde `src/main.jsx`.
  Agrupa los puntos de ruptura de tablet (1024 px), móvil (768 px) y móvil compacto (480 px).
- **Paneles de los cinco roles:** cabecera compacta, menú lateral adaptable, campanita y notificaciones
  ajustadas a la pantalla; cuadrículas de estadísticas y gráficos flexibles.
- **Tablas de administración, tickets, equipos, usuarios e historial:** desplazamiento horizontal
  dentro de la tabla cuando todas las columnas no caben. Esto mantiene visibles los botones de acciones.
- **Formularios y modales:** campos de una columna en teléfonos, zonas desplazables en ventanas emergentes,
  pies de formulario accesibles y espacios adecuados para pantallas pequeñas.
- **Cuadrículas definidas directamente en JSX:** se añadieron clases de presentación para que las reglas
  responsive puedan sustituir sus columnas fijas sin tocar los datos ni los eventos.
- **Páginas públicas:** inicio de sesión, activación/recuperación de contraseñas, registro, contacto y nosotros.
- **`Recuperar_c.css`:** sus reglas de fondo y disposición del `body` ahora se limitan a páginas
  de recuperación que muestran `.step`; antes podían afectar otras pantallas del proyecto.
- **`PanelLayout.jsx` y `Header.jsx`:** el panel se oculta al entrar en tamaño móvil mediante cambio de viewport;
  el botón de menú público informa a lectores de pantalla si está abierto.

## Instalar en una copia existente (Windows y Linux)

1. Haz una copia de seguridad o un commit del proyecto que tienes desplegado.
2. Desde la raíz de ASIS, comprueba el parche: `git apply --check ASIS_Responsive_Cambios.patch`.
3. Si pasa, aplica: `git apply ASIS_Responsive_Cambios.patch`.
4. Desde la carpeta `FrontEnd`, instala dependencias de tu propio equipo:
   `npm ci` (requiere Node.js y acceso al registro npm).
5. Prueba la compilación: `npm run build`.
6. Si Railway despliega desde GitHub, sube el commit del FrontEnd a la rama que utilice el servicio.
   Railway debe ejecutar su build habitual. No hace falta reiniciar PostgreSQL ni migrar datos.

Como alternativa al parche, puedes copiar el contenido de `FrontEnd/` del ZIP del FrontEnd a tu proyecto,
conservando tus archivos `.env` reales. No copies archivos `node_modules` entre Windows y Linux.

## Comprobaciones sugeridas en el navegador

En DevTools → Device Toolbar, revisa al menos 320×640, 375×667, 390×844, 768×1024,
1024×768 y un escritorio 1366×900. Prueba los cinco roles, y especialmente:

1. Menú lateral (abrir, navegar y cerrar).
2. Campanita y menú de notificaciones.
3. Tablas anchas: desplazar de lado hasta los botones Editar/Eliminar.
4. Modales Crear/Editar: desplazar campos y pulsar Guardar sin recortar el botón.
5. Formularios de tickets, préstamos y registro de entrada.
6. Reportes, gráficos, filtros, perfil y páginas públicas.
7. Cambiar entre tema oscuro y claro.

## Estado de la verificación

- Comprobada la sintaxis de **todos los 14 archivos CSS** con PostCSS.
- Comprobada en Chromium la ausencia de desbordamiento horizontal global en una **pantalla de prueba
  representativa** (no toda la aplicación con API) para 320, 375, 390, 768, 1024 y 1366 px.
- En 320/375 px, las tablas se desbordan **solo dentro de su contenedor con desplazamiento horizontal**.
- No se pudo ejecutar `npm run build` ni una prueba funcional de extremo a extremo sobre Railway aquí,
  porque la instalación de las dependencias de npm no finalizó en este entorno. Ejecútalo en tu computadora
  o en el pipeline de Railway antes de publicarlo.

## Qué NO se modificó

- Backend, PostgreSQL, Docker, endpoints, autenticación, SMS, correos y lógica de tickets.
- `package.json`, `package-lock.json`, configuración de Railway y variables de entorno.
