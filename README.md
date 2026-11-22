# ASIS — Asistencia Integral SENA

## Actualización de ASIS

### Iniciar en Windows o Linux

Si ya usas ASIS, copia tus archivos de configuración privados (.env en la raíz,
Backend y FrontEnd) a esta versión o aplica estos cambios sobre tu carpeta del
proyecto. Conserva el nombre del proyecto de Docker Compose y los valores de
PostgreSQL para que Docker siga usando tu volumen actual. Si cambiaste el
nombre de la carpeta, usa `docker compose -p NOMBRE_DEL_PROYECTO` en los comandos,
con el mismo nombre que muestra `docker compose ls` para la instalación anterior.

Para una instalación nueva, prepara los archivos de configuración desde la raíz.

| Sistema | Comando |
| --- | --- |
| Windows PowerShell | `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preparar_env.ps1` |
| Linux (Bash, con Python 3) | `bash scripts/preparar_env.sh` |

Luego ejecuta `docker compose up -d --build`. En Linux, agrega `sudo` delante
de `docker` si así lo usas normalmente. El frontend está en
[localhost:5173](http://localhost:5173) y la API en
[localhost:8000/docs](http://localhost:8000/docs). Para una base nueva, la
cuenta inicial se configura con `ASIS_INITIAL_ADMIN_EMAIL` y
`ASIS_INITIAL_ADMIN_PASSWORD` en el .env de la raíz. Si la cuenta ya existe,
se conserva su contraseña.

### Actualizar los permisos de una base que ya tiene datos

En Windows y Linux, con la base iniciada, ejecuta desde la raíz:

```bash
docker compose exec -T db psql -U postgres -d asisdb -v ON_ERROR_STOP=1 -1 -f /docker-entrypoint-initdb.d/03_permisos.sql
```

El script reaplica los permisos de los roles operativos de ASIS y conserva
las tablas y sus datos. Docker aplica el mismo script automáticamente al
inicializar un volumen nuevo. En ambos casos, solo el administrador puede
crear, modificar o eliminar ambientes. Cuentadante conserva la consulta de
sus ambientes, la gestión de sus equipos y los reportes de salidas.

### Gestión de usuarios

En **Administrador → Usuarios**, puedes pre-registrar, consultar, editar y
eliminar cuentas. La eliminación se bloquea si la cuenta tiene tickets,
ambientes u otros registros relacionados. Si necesitas cambiar un responsable,
actualízalo desde el módulo correspondiente. Un administrador conserva el rol
de su propia cuenta y puede editar sus demás datos.

El usuario recibe un enlace para definir su contraseña y activar la cuenta.
Desde la página pública **Registrarse**, también puede confirmar documento,
nombres, apellidos y correo para solicitar el enlace otra vez. El rol lo
define el administrador. El teléfono queda opcional.

### Campanita y SMS

Los cinco roles pueden abrir la campanita. Al seleccionar una notificación
propia, se marca como leída. Los avisos se generan automáticamente al crear un
ticket, asignarlo o cambiar su estado. Al registrar el ticket se avisa al
administrador, a Mesa de Ayuda y al cuentadante responsable, excluyendo a quien
creó el reporte. La asignación avisa al técnico y el cambio de estado o atención
avisa a quien reportó y al cuentadante responsable.

El SMS está desactivado de forma predeterminada. Para habilitarlo, crea una
cuenta de Twilio con un número emisor habilitado para SMS y una clave de API.
Agrega estas variables a `Backend/.env` en el equipo que ejecuta Docker.

```dotenv
ASIS_SMS_ENABLED=true
TWILIO_ACCOUNT_SID=
TWILIO_API_KEY=
TWILIO_API_SECRET=
TWILIO_FROM_NUMBER=
ASIS_SMS_ALLOWED_NUMBERS=
```

`TWILIO_API_KEY` es el SID de la clave que empieza por SK y
`TWILIO_API_SECRET` es su secreto. `TWILIO_FROM_NUMBER` lleva el número
internacional de Twilio. En pruebas de Twilio, verifica el número destinatario.
Usa el formato `+573001234567` para un celular colombiano. ASIS también
reconoce los celulares colombianos de diez dígitos que empiezan por 3.
Para pruebas con una base de demostración, especifica en
`ASIS_SMS_ALLOWED_NUMBERS` solo tus números verificados, separados por comas.
Si se deja vacío, se consideran todos los destinatarios activos con un
teléfono válido. Los usuarios de demostración de una instalación nueva
tienen el teléfono vacío.
Guarda estos valores en el backend y aplica la configuración.

```bash
docker compose up -d --force-recreate backend
```

Para verificar el envío, asigna un ticket a un técnico activo con teléfono
configurado. Revisa la campanita y el registro de mensajes en Twilio. Si el
proveedor no acepta el SMS, el ticket y el aviso en la app siguen disponibles.
Consulta el [inicio rápido de Twilio](https://www.twilio.com/docs/messaging/quickstart).

### Campos obligatorios

| Formulario | Campos requeridos |
| --- | --- |
| Confirmación de pre-registro | Número de documento, nombres, apellidos y correo registrado |
| Login, recuperación y activación | Correo y contraseña para iniciar sesión, correo para solicitar recuperación, y enlace o token más contraseña y confirmación al activarla o restablecerla |
| Pre-registro y edición de usuarios | Nombres, apellidos, correo, tipo y número de documento, y rol |
| Ambientes y equipos | Número, nombre y ubicación del ambiente al crearlo. Código, nombre, tipo y ambiente del equipo |
| Tickets y salidas | Ambiente, equipo, tipo de salida y motivo al registrar. Equipo y motivo al editar un reporte pendiente. Estado y acción al actualizar un ticket técnico |
| Perfil, contacto y búsqueda de historial | Nombres y apellidos en el perfil. Nombre, correo, categoría y mensaje en contacto. Serial al consultar historial por equipo |

En los formularios correspondientes, teléfono, observación, imagen,
motivo de novedad, capacidad y descripción siguen siendo opcionales.

---



Sistema web para la **gestión de tickets de equipos tecnológicos** (daños, traslados y préstamos) del Centro de Gestión de Mercados, Logística y Tecnologías de la Información (CGMLTI) del SENA. Permite reportar una falla, asignar un técnico, seguir el estado de cada equipo, mantener su historial y generar reportes, con un panel distinto para cada rol.

> **Stack:** FastAPI + SQLModel + PostgreSQL (Backend) · React 18 + Vite (FrontEnd) · Docker Compose.

---

## Tabla de contenido

1. [Características principales](#1-características-principales)
2. [Arquitectura general](#2-arquitectura-general)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Tecnologías y librerías](#4-tecnologías-y-librerías)
5. [Base de datos](#5-base-de-datos)
6. [Backend en detalle](#6-backend-en-detalle)
7. [FrontEnd en detalle](#7-frontend-en-detalle)
8. [Roles y permisos](#8-roles-y-permisos)
9. [Flujos principales](#9-flujos-principales)
10. [Variables de entorno](#10-variables-de-entorno)
11. [Instalación y ejecución](#11-instalación-y-ejecución)
12. [Datos de prueba](#12-datos-de-prueba)
13. [Mapeo de requisitos funcionales](#13-mapeo-de-requisitos-funcionales-rf)
14. [Seguridad: estado actual y recomendaciones](#14-seguridad-estado-actual-y-recomendaciones)
15. [Inconsistencias conocidas y pendientes](#15-inconsistencias-conocidas-y-pendientes)
16. [Equipo de desarrollo](#16-equipo-de-desarrollo)

---

## 1. Características principales

- **Autenticación** con correo/contraseña (OAuth2 + JWT) e inicio de sesión con **Google**.
- **Pre-registro de usuarios** por el administrador y **activación de cuenta por correo** (RF-016).
- **Recuperación de contraseña** por correo con token de un solo propósito (RF-018).
- **Cierre de sesión automático** tras 15 minutos de inactividad (RF-017).
- **Cinco paneles por rol:** Administrador, Mesa de Ayuda, Técnico, Instructor y Cuentadante.
- **Tickets** con tipo de salida (`daño`, `traslado`, `préstamo`), imagen adjunta (JPG/PNG), estados con color e historial completo.
- **Asignación, reasignación y desasignación** de técnicos.
- **Notificaciones** de tickets por correo, SMS opcional y campanita en los cinco paneles.
- **CRUD** de usuarios, ambientes, equipos y catálogos (roles, estados, tipos de equipo, motivos de novedad, tipos de documento).
- **Dashboard y reportes**: gráficas con Recharts y **12 reportes exportables a PDF y Excel**.
- **Historial de un equipo por serial** y de un usuario.
- **Tema claro/oscuro** persistente.
- Formulario público de **Contáctanos** y página **Nosotros**.

---

## 2. Arquitectura general

```
┌───────────────────────┐      HTTP/JSON (axios, fetch)      ┌──────────────────────────┐
│  FrontEnd (React+Vite)│ ─────────────────────────────────► │  Backend (FastAPI)       │
│  http://localhost:5173│ ◄───────────────────────────────── │  http://localhost:8000   │
└───────────────────────┘        JWT Bearer / CORS           │  /docs (Swagger UI)      │
          │                                                  └──────────┬───────────────┘
          │ Google OAuth (@react-oauth/google)                          │ SQLModel / SQLAlchemy
          ▼                                                             ▼ (psycopg2)
     Google Identity                                          ┌──────────────────────────┐
                                                              │  PostgreSQL 15           │
                                                              │  BD: asisdb (puerto 5433 │
                                                              │  en el host con Docker)  │
                                                              └──────────────────────────┘
   Backend ──SMTP──► Correo (activación, recuperación, notificaciones, contacto)
   Backend ──StaticFiles──► /uploads/tickets/*  (imágenes de tickets)
```

- El **Backend** expone una API REST. Cada recurso tiene su propio router (`enrutadores/`) y su modelo (`Modelos/`).
- Las tablas se crean automáticamente al arrancar (`SQLModel.metadata.create_all`) y, con Docker, el script `insert_datos.sql` crea el esquema, las vistas y los datos iniciales.
- Los **reportes del dashboard** se leen desde **vistas SQL** (`vista_*`), no desde el ORM.
- Los **correos** se envían en segundo plano con `BackgroundTasks`, para no bloquear la respuesta.
- El **FrontEnd** es una SPA con `react-router-dom`. La sesión vive en `localStorage` (`access_token`, `usuario`).

---

## 3. Estructura del proyecto

```
Asis-Project-/
├── README.md
├── docker-compose.yml            # Orquesta db + backend + frontend
├── .gitignore
│
├── base_de_datos/
│   └── insert_datos.sql          # Esquema completo + vistas + datos iniciales
│
├── Backend/
│   ├── main.py                   # App FastAPI (variable `asis`), CORS, estáticos, routers
│   ├── conexion_db.py            # Motor SQLModel, lifespan (create_all), sesión inyectable
│   ├── seguridad.py              # bcrypt, JWT, tokens de propósito, dependencias de rol
│   ├── correo.py                 # Correos de activación / recuperación / alerta (RF-016, RF-018)
│   ├── encriptar_bd.py           # Script único: hashea contraseñas en texto plano existentes
│   ├── base_de_datos.txt         # Script SQL de referencia (versión anterior del esquema)
│   ├── requierements_def.txt     # Dependencias Python
│   ├── dockerfile / .dockerignore / .env
│   ├── Modelos/                  # Modelos SQLModel (tablas) y esquemas Pydantic
│   │   ├── Usuarios.py  roles.py  tipo_documento.py
│   │   ├── ambientes.py equipos.py tipo_equipo.py
│   │   ├── tickets.py   estados_ticket.py motivo_novedad.py
│   │   ├── asig_tec.py  His_tickets.py notificaciones.py
│   ├── enrutadores/              # Routers (endpoints REST)
│   │   ├── auth.py  Usuarios.py  roles.py  tipo_documento.py
│   │   ├── ER_ambientes.py  ER_equipos.py  tipo_equipo.py
│   │   ├── ticket.py  estados_ticket.py  motivo_novedad.py
│   │   ├── asig_tec.py  His_tickets.py  notificaciones.py
│   │   ├── dashboard.py  contactanos.py
│   ├── servicios/
│   │   └── correo.py             # Correos HTML de tickets (creación, estado, asignación)
│   └── uploads/tickets/          # Imágenes adjuntas (ticket_<id>.jpg|png)
│
└── FrontEnd/
    ├── index.html  vite.config.js  package.json  dockerfile  .env
    ├── public/
    │   ├── IMG/                  # Logo, fotos del equipo de desarrollo
    │   └── notificacion.mp3      # Sonido de notificación
    └── src/
        ├── main.jsx              # Punto de entrada + GoogleOAuthProvider + estilos globales
        ├── App.jsx               # Todas las rutas
        ├── components/           # Layouts y componentes compartidos
        ├── hooks/                # useAutoLogout, useNotificaciones, useTheme
        ├── services/             # api.js (axios + login) y adminService.js (todas las llamadas)
        ├── styles/               # CSS por módulo + theme.css (variables de tema)
        └── pages/
            ├── Login · Registrarse · ActivarCuenta · RecuperarContrasena · RestablecerContrasena
            ├── Nosotros · Contactanos · RegistrarTicketSimple
            ├── Administrador/            (+ reportes/: calculos, exportarPDF, exportarExcel)
            ├── Administrador_mesa_de_ayuda/
            ├── Tecnico/
            ├── instructor/
            └── Cuentadante/
```

---

## 4. Tecnologías y librerías

### 4.1 Infraestructura

| Herramienta | Versión | Uso |
|---|---|---|
| **Docker / Docker Compose** | compose `3.8` | Levanta base de datos, backend y frontend con un solo comando. |
| **PostgreSQL** | 15 (`postgres:15-alpine`) | Base de datos relacional. Contenedor `asis_db`, puerto host `5433`. |
| **Python** | 3.12 (`python:3.12-slim`) | Runtime del backend en Docker. |
| **Node.js** | 22 (`node:22-alpine`) | Runtime del frontend en Docker. |

### 4.2 Backend (Python) — `Backend/requierements_def.txt`

**Núcleo de la API**

| Librería | Versión | Para qué se usa en ASIS |
|---|---|---|
| `fastapi` | 0.141.1 | Framework web: routers, validación, inyección de dependencias, `BackgroundTasks`, `OAuth2PasswordBearer`, Swagger automático. |
| `starlette` | 1.6.0 | Base de FastAPI: `StaticFiles` (sirve `/uploads`), `CORSMiddleware`. |
| `uvicorn` | 0.52.4 | Servidor ASGI. Comando: `uvicorn main:asis`. |
| `uvloop`, `httptools`, `watchfiles`, `websockets` | 0.22.1 / 0.8.0 / 1.2.0 / 17.1 | Extras de rendimiento y recarga automática de Uvicorn. |
| `python-multipart` | 0.0.32 | Necesaria para `Form(...)` y `UploadFile` (creación de tickets con imagen) y para el formulario de login. |
| `fastapi-cli`, `fastapi-cloud-cli`, `typer`, `rich`, `rich-toolkit`, `click`, `shellingham` | varias | Herramientas de línea de comandos de FastAPI (`fastapi dev`). No intervienen en la lógica. |

**Datos y validación**

| Librería | Versión | Uso |
|---|---|---|
| `sqlmodel` | 0.0.42 | ORM principal: combina SQLAlchemy y Pydantic. Define tablas (`table=True`) y esquemas `Crear/Editar/Leer`. |
| `SQLAlchemy` | 2.0.52 | Motor, sesiones y consultas (`select`, `join`, `text`). |
| `psycopg2-binary` | 2.9.12 | Driver PostgreSQL (URL `postgresql+psycopg2://`). |
| `greenlet` | 3.5.5 | Dependencia de SQLAlchemy. |
| `pydantic`, `pydantic_core`, `pydantic-settings`, `pydantic-extra-types`, `annotated-types`, `annotated-doc`, `typing_extensions`, `typing-inspection` | 2.13.x… | Validación de datos y esquemas de entrada/salida. |
| `email-validator` | 2.3.0 | Validación de correos en Pydantic (con `dnspython`, `idna`). |

**Seguridad y autenticación**

| Librería | Versión | Uso |
|---|---|---|
| `passlib` | 1.7.4 | `CryptContext` con esquema **bcrypt** para hashear contraseñas. |
| `bcrypt` | 4.0.1 | Backend de hashing que usa passlib. *(Versión fijada a propósito: `passlib 1.7.4` no es compatible con `bcrypt >= 4.1`.)* |
| `python-jose` | 3.5.0 | Creación y verificación de **JWT** (HS256). Dependencias: `ecdsa`, `rsa`, `pyasn1`, `cryptography`, `cffi`, `pycparser`. |
| `google-auth`, `google-auth-oauthlib` | sin versión fijada | Importadas en `auth.py` para el login con Google (ver nota en §15). |

**HTTP y correo**

| Librería | Uso |
|---|---|
| `httpx` 0.28.1 | Cliente HTTP asíncrono: consulta `googleapis.com/oauth2/v2/userinfo` para validar el token de Google. (`httpcore`, `h11`, `anyio`, `certifi` son sus dependencias.) |
| `requests`, `urllib3` | Cliente HTTP síncrono, disponible (importado en `auth.py`). |
| `smtplib` / `email.mime` *(biblioteca estándar)* | Envío de correos HTML por SMTP. |

**Configuración**

| Librería | Uso |
|---|---|
| `python-dotenv` 1.2.3 | `load_dotenv()` en `servicios/correo.py` para leer `.env`. |
| `dotenv` 0.9.9 | Paquete duplicado/alias de `python-dotenv` (ver §15). |
| `PyYAML`, `Pygments`, `markdown-it-py`, `mdurl` | Dependencias transitivas de las herramientas CLI. |

**Presentes en el archivo pero sin uso en el código revisado**

`Flask`, `Werkzeug`, `Jinja2`, `itsdangerous`, `blinker`, `MarkupSafe` (Flask y sus dependencias), `mysql-connector-python`, `PyMySQL` (drivers de MySQL), `sentry-sdk`, `agent-detector`, `detect-installer`, `fastar`, `rignore`, `virtualenv`, `distlib`, `filelock`, `platformdirs`, `colorama`, `six`. No se importan en ningún `.py`; parecen arrastradas de un entorno virtual y se pueden retirar (§15).

### 4.3 FrontEnd (JavaScript) — `FrontEnd/package.json`

**Dependencias**

| Librería | Versión | Para qué se usa |
|---|---|---|
| `react`, `react-dom` | ^18.3.1 | Interfaz de usuario. |
| `react-router-dom` | ^6.26.0 | Enrutamiento SPA (`BrowserRouter`, `Routes`, `NavLink`, `useNavigate`, `useSearchParams`). |
| `axios` | ^1.20.0 | Cliente HTTP (`services/api.js`, `adminService.js`). |
| `@react-oauth/google` | ^0.13.5 | Botón/flujo de **Login con Google** (`GoogleOAuthProvider`, `useGoogleLogin`). |
| `recharts` | ^3.10.1 | Gráficas de los paneles (`BarChart`, `LineChart`, `PieChart`). |
| `jspdf` | ^2.5.2 | Generación de reportes en **PDF**. |
| `jspdf-autotable` | ^3.8.4 | Tablas dentro de los PDF. |
| `xlsx` (SheetJS) | ^0.18.5 | Generación de reportes en **Excel**. |

`jspdf`, `jspdf-autotable` y `xlsx` se cargan con `import()` dinámico (carga diferida), por lo que no pesan en el resto de la aplicación.

**Desarrollo**

| Librería | Versión | Uso |
|---|---|---|
| `vite` | ^5.4.0 | Servidor de desarrollo y *bundler*. |
| `@vitejs/plugin-react` | ^4.3.1 | Soporte JSX/Fast Refresh. |

**Fuentes (Google Fonts, vía `index.html`):** Space Grotesk, Inter y JetBrains Mono.

---

## 5. Base de datos

Motor: **PostgreSQL 15**. Nombre de la base: **`asisdb`**. Esquema completo en `base_de_datos/insert_datos.sql`.

### 5.1 Tablas

| Tabla | Descripción | Campos y relaciones clave |
|---|---|---|
| `tipo_identificacion` | Tipos de documento (CC, CE, TI, RC, PAS, NIT, PEP, PPT). | `id_tipo_id`, `iniciales`, `nombre_tipo` |
| `rol` | Roles del sistema. | `id_rol`, `nombre_rol` |
| `usuarios` | Personas del sistema. | `correo_u` y `numero_documento` **únicos**; `contrasena_u` (hash bcrypt); `activo` (bool); FK a `rol` y `tipo_identificacion`. `CHECK` de dominio: `@sena.edu.co`, `@soy.sena.edu.co` o `@gmail.com`. |
| `ambientes` | Aulas/laboratorios. | `id_ambiente` **manual** (101, 102…); `estado`; `capacidad_equipos`; FK `id_cuentadante` → `usuarios`. |
| `tipo_equipo` | Catálogo de tipos de activo. | `id_tipo`, `nombre_t` |
| `equipos` | Inventario. | `codigo`, `serial` **único**, `estado`, FK a `ambientes` y `tipo_equipo`. |
| `estados_ticket` | Estados con color. | `nombre_e`, `color` (nombre en español: rojo, naranja…). |
| `motivo_novedad` | Causas de baja/novedad. | `nombre_novedad` |
| `tickets` | Núcleo del sistema. | `motivo`, `fecha_salida`, `fecha_retorno`, `atendido`, `tipo_salida`, `imagen`, `id_ambiente_destino`, `persona_prestamo`, `fecha_devolucion`; FK a `equipos`, `creado_por`, `asignado_a`, `estados_ticket`, `motivo_novedad`. |
| `asignacion_tecnico` | Registro de asignaciones. | `id_ticket`, `id_tecnico`, `asignado_por`, `fecha_asignacion` |
| `historial_tickets` | Bitácora de acciones por ticket. | `accion`, `observacion`, `estado_resultante`, `fecha`, FK a `tickets` y `usuarios` |
| `notificaciones` | Notificaciones internas. | `canal`, `mensaje`, `enviada` (se usa como «leída»), `notificado_para`, `notificado_por`, `id_ticket` |

### 5.2 Diagrama de relaciones (simplificado)

```
rol ──< usuarios >── tipo_identificacion
          │  ▲
          │  └──────────── id_cuentadante
          ▼
      ambientes ──< equipos >── tipo_equipo
                       │
                       ▼
                    tickets >── estados_ticket
                       │   └─── motivo_novedad
        ┌──────────────┼───────────────┐
        ▼              ▼               ▼
asignacion_tecnico  historial_tickets  notificaciones
```

### 5.3 Vistas (alimentan el dashboard y los historiales)

| Vista | Contenido |
|---|---|
| `vista_tickets_por_mes` | Tickets agrupados por mes de creación. |
| `vista_tickets_por_estado` | Total por estado, con color. |
| `vista_danos_por_ambiente` | Total de tickets por ambiente. |
| `vista_motivos_novedad` | Total por motivo de novedad. |
| `vista_tickets_por_tipo` | Total por tipo de equipo. |
| `vista_historial_equipo` | Historial de acciones por equipo (serial). |
| `vista_historial_usuario` | Historial de acciones por usuario. |

### 5.4 Datos iniciales

- **Roles:** `instructor`, `tecnico`, `administrador`, `cuentadante`, `administrador_mesa_ayuda`.
- **Estados:** Pendiente (rojo), En reparacion (naranja), Reparado (amarillo), Entregado en ambiente (verde), Dado de baja (negro), Inactivar ticket (morado), Trasladado (azul).
- **Tipos de equipo:** Computador, Portátil, Televisor, Cargador, All In One, Computador de Mesa, Mac, Laptop, TV.
- **20 motivos de novedad**, 20 usuarios, 20 ambientes (101–120), 20 equipos y tickets de ejemplo.

> **Nota:** con Docker, `insert_datos.sql` se ejecuta **solo la primera vez** (cuando el volumen `postgres_data` está vacío). Para reiniciar los datos: `docker compose down -v`.

---

## 6. Backend en detalle

### 6.1 Archivos de la raíz

| Archivo | Responsabilidad |
|---|---|
| `main.py` | Crea la app (`asis = FastAPI(...)`), monta `/uploads`, configura CORS (`localhost:5173` y `127.0.0.1:5173`) y registra los 15 routers. Ruta `GET /` de prueba. |
| `conexion_db.py` | Lee `DATABASE_URL` (con valor por defecto local), crea el motor, ejecuta `create_all` en el *lifespan* y expone `Sesion_dependencia` (sesión inyectable). |
| `seguridad.py` | Hash/verificación bcrypt, `crear_token`/`verificar_token` (JWT HS256, 8 h), tokens de propósito (activación/recuperación), y dependencias `solo_admin` y `solo_tecnico`. |
| `correo.py` | Envío SMTP de correos de activación, recuperación y alerta a administradores. **Si no hay SMTP configurado, imprime el correo (con el link) en la consola.** |
| `servicios/correo.py` | Correos HTML con diseño para tickets: nuevo ticket, cambio de estado, asignación. |
| `encriptar_bd.py` | Script de un solo uso para hashear contraseñas que estuvieran en texto plano. |

### 6.2 Modelos (`Modelos/`)

Cada modelo sigue el patrón SQLModel: `…Base` → `…Crear` / `…Editar` / `…Leer` y la clase con `table=True`.
`UsuarioLeer` **omite la contraseña** a propósito, para que nunca se devuelva en las respuestas.

### 6.3 Endpoints

Documentación interactiva automática en **`http://localhost:8000/docs`**.

| Prefijo | Método y ruta | Descripción |
|---|---|---|
| **/auth** | `POST /login` | Login (formulario OAuth2: `username` = correo, `password`). Verifica `activo`. Devuelve JWT + datos + rol. |
| | `GET /yo` | Perfil del usuario autenticado. |
| | `POST /confirmar-datos` | RF-016: valida documento, nombres, apellidos y correo; envía link de activación. Mensaje genérico siempre. |
| | `POST /activar-cuenta` | Recibe token + nueva contraseña; activa la cuenta. |
| | `POST /solicitar-recuperacion` | RF-018: envía link (30 min). Mensaje genérico siempre. |
| | `POST /restablecer-contrasena` | Token + nueva contraseña. |
| | `POST /google-login` | Valida el token de Google y emite el JWT de ASIS si el correo existe y está activo. |
| **/usuarios** | `GET /`, `GET /tecnicos`, `GET /{id}` | Listar, listar solo técnicos, obtener uno. |
| | `POST /`, `POST /pre-registrar` | Crear usuario (hashea contraseña) / pre-registrar sin contraseña (inactivo + correo de activación). |
| | `PUT /{id}`, `DELETE /{id}` | Editar (re-hashea si cambia la contraseña) / eliminar. |
| **/tickets** | `GET /`, `GET /{id}` | Listar / obtener. |
| | `POST /` | Crear (multipart): imagen JPG/JPEG/PNG → `uploads/tickets/ticket_<id>.<ext>`; notifica por correo en segundo plano. |
| | `PUT /{id}` | Editar; si cambia el estado, notifica al cuentadante y al creador. |
| | `PUT /{id}/asignar`, `/reasignar`, `/desasignar` | Gestión del técnico asignado. |
| | `DELETE /{id}` | Eliminar. |
| **/asignacion** | CRUD | Registro de asignaciones; valida que el usuario tenga rol `tecnico` y le envía correo. |
| **/His_tickets** | `GET/POST /his_tickets`, `GET/PUT/DELETE /his_tickets/{id}` | Historial de acciones por ticket. |
| **/notificaciones** | CRUD en `/notificaciones`, `GET /usuario/{id}`, `PUT /marcar-leida/{id}` | Notificaciones internas. |
| **/ambientes** | `GET /`, `GET /mis-ambientes`, `GET/PUT/DELETE /{id}`, `POST /` | `mis-ambientes` filtra por rol (admin/mesa: todos; cuentadante: los suyos; instructor: activos). |
| **/equipos** | CRUD; `GET /?id_ambiente=` | Inventario, con filtro opcional por ambiente. |
| **/roles**, **/tipo_equipo**, **/estados_ticket**, **/motivos-novedad**, **/Tipo_identificacion** | CRUD | Catálogos. |
| **/dashboard** | `GET /tickets-por-mes`, `/tickets-por-estado`, `/danos-por-ambiente`, `/motivos-novedad`, `/tickets-por-tipo` | Datos agregados desde las vistas SQL. |
| | `GET /historial-equipo/{serial}`, `GET /historial-usuario/{id_usuario}` | Historiales (404 si no hay resultados). |
| **/contacto** | `POST /` | Formulario «Contáctanos»: solo acepta correos `@sena.edu.co` y reenvía el mensaje al correo del grupo ASIS. |
| **/uploads** | `GET /uploads/tickets/<archivo>` | Archivos estáticos (imágenes de tickets). |

### 6.4 Notificaciones por correo

| Evento | Destinatarios |
|---|---|
| Ticket creado | Cuentadante del ambiente + administradores de mesa de ayuda + técnico asignado (sin el creador). |
| Cambio de estado | Cuentadante del ambiente + creador del ticket. |
| Técnico asignado | Solo el técnico asignado. |
| Activación / recuperación | El propio usuario. |
| Datos de activación que no coinciden | Todos los administradores. |

---

## 7. FrontEnd en detalle

### 7.1 Rutas (`src/App.jsx`)

| Zona | Rutas |
|---|---|
| **Públicas** | `/` (→ `/login`), `/login`, `/registrarse`, `/activar-cuenta`, `/recuperar`, `/restablecer-contrasena`, `/nosotros`, `/contactanos` |
| **Administrador** | `/administrador`, `/administrador/usuarios`, `/ambientes`, `/equipos`, `/tickets`, `/reportes`, `/configuracion` |
| **Mesa de Ayuda** | `/mesa-ayuda/panel`, `/tickets`, `/historial`, `/asignar`, `/tecnicos`, `/reportes` |
| **Técnico** | `/tecnico`, `/tecnico/disponibles`, `/tickets`, `/historial`, `/perfil` |
| **Instructor** | `/instructor`, `/instructor/reportar`, `/instructor/mis-reportes`, `/instructor/equipos` |
| **Cuentadante** | `/cuentadante`, `/inventario`, `/ambientes`, `/salida`, `/mis-reportes`, `/historial`, `/reportes` |
| **Comodín** | `*` → `/login` |

### 7.2 Componentes compartidos (`src/components/`)

| Componente | Función |
|---|---|
| `PanelLayout.jsx` | Layout genérico por rol: sidebar con `navItems`, barra superior, campanita de notificaciones, cambio de tema, cierre de sesión. Verifica que el rol guardado coincida con el de la sección. |
| `AdminLayout.jsx` | Configura el menú del administrador sobre `PanelLayout` y activa `useAutoLogout`. |
| `Header.jsx` | Encabezado público (logo, Nosotros, Contáctanos, tema, enlace de acceso). |
| `BarraSuperior.jsx` | Barra superior heredada de las pantallas originales. |
| `SalidaEquipoForm.jsx` | Formulario de salida de equipo (RF-006): ambiente → equipo → tipo (`dano`/`traslado`/`prestamo`) → motivo → imagen. Asigna el estado inicial según el tipo y marca el equipo como `dañado` si es daño. |
| `TicketDetailPanel.jsx` | Panel de detalle con historial completo del ticket (RF-012). |
| `EditarTicketPendienteModal.jsx` | Edición de un ticket pendiente (RF-009). |
| `ImagenTicket.jsx` | Muestra la imagen adjunta tomándola de `http://localhost:8000/…`. |

### 7.3 Hooks (`src/hooks/`)

| Hook | Función |
|---|---|
| `useAutoLogout` | Cierra la sesión tras **15 min** sin `mousedown`, `keydown`, `scroll` ni `touchstart` (RF-017). |
| `useNotificaciones(idUsuario)` | *Polling* cada **10 s** a `/notificaciones/usuario/{id}`; calcula no leídas, reproduce `notificacion.mp3` cuando aumentan y permite marcar como leída. |
| `useTheme` | Alterna `light-mode` en `<body>` y guarda la preferencia en `localStorage` (`asis-theme`, por defecto oscuro). |

### 7.4 Servicios (`src/services/`)

- **`api.js`**: instancia de axios (`baseURL: http://localhost:8000`), `login()` (envía `x-www-form-urlencoded`), `getToken`, `getAuthHeaders`, `logout`.
- **`adminService.js`**: todas las llamadas al backend agrupadas por recurso (usuarios, roles, ambientes, equipos, tickets, estados, motivos, asignaciones, historial, dashboard, notificaciones, recuperación, pre-registro). Incluye utilidades como `obtenerUsuarioActual()`, `resolverColorEstado()` (traduce «rojo», «azul»… a colores hex) y `listarTicketsAdministrador()` (une tickets con equipo, ambiente, estado, etc.).

### 7.5 Módulo de reportes (`pages/Administrador/reportes/`)

| Archivo | Función |
|---|---|
| `calculos.js` | Funciones puras que generan los reportes con una forma única `{ id, titulo, descripcion, columnas, filas, nota? }`. Contiene `CATALOGO_REPORTES`, filtros (rango de fechas, ambiente, tipo) y cálculo del tiempo de resolución. |
| `exportarPDF.js` | Un PDF con una sección por reporte, encabezado ASIS y filtros aplicados (`jspdf` + `jspdf-autotable`). |
| `exportarExcel.js` | Un `.xlsx` con una hoja por reporte (`xlsx`). |

**Los 12 reportes:** resumen general · tickets por ambiente · por mes · por estado · por tipo de activo · salidas por tipo · motivos de novedad más frecuentes · rendimiento por técnico · equipos con más daños · inventario por ambiente y estado · usuarios por rol · listado detallado de tickets. Agregar uno nuevo solo requiere añadirlo a `CATALOGO_REPORTES`.

### 7.6 Estilos (`src/styles/`)

`theme.css` define las variables de tema (oscuro por defecto: fondo `#001f3f`, acento `#45B3BF`; claro con `body.light-mode`). El resto son hojas por módulo: `global`, `login`, `Registrarse`, `Recuperar_c`, `Nosotros`, `Contactanos`, `panelAdmin` (sistema de paneles), `ticketsGlobal`, `ticketDetalle`, `Cambio_de_estado_tickets`, `centroReportes`.

### 7.7 Páginas por rol

| Rol | Páginas |
|---|---|
| **Administrador** | Panel (gráficas de usuarios por rol y actividad mensual), Usuarios (CRUD + pre-registro), Ambientes (CRUD + asignar cuentadante), Equipos, Tickets, Reportes, Configuración (informativa/estática). |
| **Mesa de Ayuda** | Panel (gráficas de estado y por ambiente), Tickets (incluye «Registrar entrada» y revertir «Dado de baja»), Historial, Asignar Técnico (pestañas «Sin asignar» / «Reasignar»), Técnicos, Reportes. |
| **Técnico** | Panel, Tickets Disponibles, Mis Tickets (con filtro por tipo de activo), Historial, Perfil. |
| **Instructor** | Panel, Reportar Falla, Mis Reportes, Equipos. |
| **Cuentadante** | Panel (solo sus ambientes), Inventario, Ambientes, Registrar Salida, Mis Reportes, Historial de Equipos (por serial), Reportes. |

---

## 8. Roles y permisos

| Rol (`rol.nombre_rol`) | Ruta de inicio | Puede hacer |
|---|---|---|
| `administrador` | `/administrador` | Gestionar usuarios (pre-registro), ambientes, equipos, tickets y reportes. |
| `administrador_mesa_ayuda` | `/mesa-ayuda/panel` | Gestionar tickets, asignar/reasignar técnicos, registrar entradas, ver historial y reportes. |
| `tecnico` | `/tecnico` | Tomar y atender tickets, cambiar estados, ver su historial y perfil. |
| `instructor` | `/instructor` | Reportar fallas/salidas, ver y editar sus tickets pendientes, consultar equipos. |
| `cuentadante` | `/cuentadante` | Ver inventario y ambientes **a su cargo**, registrar salidas, consultar historial de equipos y reportes. |

La redirección tras el login depende del rol devuelto por el backend. En el FrontEnd, `PanelLayout`/`AdminLayout` comparan el rol guardado con el de la sección y expulsan al login si no coincide.

---

## 9. Flujos principales

### 9.1 Ciclo de vida de un ticket

```
Instructor/Cuentadante registra salida (daño | traslado | préstamo)  ──►  estado inicial
        │                                                            (Pendiente / Trasladado)
        ▼
Mesa de Ayuda asigna técnico ──► Técnico atiende ──► En reparación ──► Reparado
        │                                                                  │
        └──► (reasignar / desasignar)                          Entregado en ambiente
                                                  o  Dado de baja (con motivo de novedad)
Cada cambio ──► historial_tickets + notificación + correo
```

### 9.2 Alta de usuario (RF-016)

1. El administrador **pre-registra** al usuario (`POST /usuarios/pre-registrar`): queda `activo=False` con una contraseña aleatoria inutilizable y recibe un correo con el link.
2. Alternativamente, la persona confirma sus datos en `/auth/confirmar-datos`; si coinciden con el pre-registro, recibe el link.
3. El link lleva a `/activar-cuenta?token=…` (token válido 24 h), donde crea su contraseña. La cuenta queda activa.

### 9.3 Recuperación de contraseña (RF-018)

`/recuperar` → `POST /auth/solicitar-recuperacion` → correo con link (30 min) → `/restablecer-contrasena?token=…` → `POST /auth/restablecer-contrasena`. Siempre se responde el mismo mensaje exista o no el correo.

### 9.4 Sesión

JWT con **8 horas** de vigencia en el servidor y cierre por inactividad a los **15 minutos** en el cliente. El token y el objeto `usuario` se guardan en `localStorage`.

---

## 10. Variables de entorno

### Backend (`Backend/.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión SQLAlchemy. Con Docker la define `docker-compose.yml`; sin Docker usa un valor local por defecto (`localhost:5432/asisdb`). |
| `SMTP_SERVER` | Servidor SMTP usado por `servicios/correo.py` y `contactanos.py`. |
| `SMTP_PORT` | Puerto SMTP (587 por defecto). |
| `CORREO_APP` / `CONTRASENA_APP` | Cuenta y contraseña de aplicación para los correos de tickets (`servicios/correo.py`). |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Configuración SMTP para activación, recuperación, alertas y contacto (`correo.py`, `contactanos.py`). |
| `FRONTEND_URL` | URL base del FrontEnd para armar los links de los correos (por defecto `http://localhost:5173`). |
| `GRUPO_ASIS_CORREO` | Buzón que recibe los mensajes del formulario de contacto. |

> Hay dos juegos de variables SMTP (`SMTP_SERVER/CORREO_APP/CONTRASENA_APP` y `SMTP_HOST/SMTP_USER/SMTP_PASS`) porque dos módulos distintos envían correos. Si el segundo no está configurado, los correos de activación/recuperación se imprimen en la consola del backend.

### FrontEnd (`FrontEnd/.env`)

| Variable | Descripción |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | ID de cliente OAuth de Google para el inicio de sesión. |

> ⚠️ **Nunca subas los `.env` al repositorio.** Usa un `.env.example` con valores vacíos (§14).

---

## 11. Instalación y ejecución

### Opción A — Docker (recomendada)

Requisitos: Docker y Docker Compose.

```bash
git clone https://github.com/camilahm1018-commits/Asis-Project-.git
cd Asis-Project-

# Configura Backend/.env y FrontEnd/.env (ver sección 10)

docker compose up --build
```

| Servicio | URL |
|---|---|
| FrontEnd | http://localhost:5173 |
| Backend / API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| PostgreSQL (desde el host) | `localhost:5433` (usuario y base de datos definidos en `docker-compose.yml`) |

Comandos útiles:

```bash
docker compose logs -f backend      # Ver logs (aquí aparecen los correos si no hay SMTP)
docker compose down                 # Detener
docker compose down -v              # Detener y borrar la base (se reejecuta insert_datos.sql)
```

### Opción B — Manual

Requisitos: Python 3.12, Node.js 18+ y PostgreSQL 15.

**1. Base de datos**

```bash
createdb asisdb
psql -d asisdb -f base_de_datos/insert_datos.sql
```

**2. Backend**

```bash
cd Backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requierements_def.txt
export DATABASE_URL="postgresql+psycopg2://USUARIO:CLAVE@localhost:5432/asisdb"
uvicorn main:asis --reload          # http://localhost:8000
```

**3. FrontEnd**

```bash
cd FrontEnd
npm install
npm run dev                         # http://localhost:5173
```

Otros scripts: `npm run build` (compila a `dist/`) y `npm run preview`.

---

## 12. Datos de prueba

`insert_datos.sql` carga usuarios de ejemplo (correos `@sena.edu.co`). Todos comparten la misma contraseña de demostración, indicada en el comentario del propio script. **Cámbiala o elimina estos usuarios antes de cualquier despliegue real.**

| Rol | Usuarios de ejemplo |
|---|---|
| Cuentadante | `janer.cillopillo@`, `luisa.fernandez@`, `oscar.ruiz@`, `tatiana.diaz@`, `cristian.mendoza@` |
| Instructor | `carlos.ramirez@`, `laura.martinez@`, `andres.gomez@`, `paula.rojas@`, `miguel.torres@` |
| Técnico | `daniel.castro@`, `camila.lopez@`, `felipe.herrera@`, `natalia.vargas@`, `kevin.suarez@` |
| Administrador | `jhon.perez@`, `diana.morales@`, `sergio.garcia@` |
| Mesa de Ayuda | `valentina.ortega@`, `julian.silva@`, `melissa.cortes@` |

(Todos con el dominio `@sena.edu.co`.)

---

## 13. Mapeo de requisitos funcionales (RF)

| RF | Descripción | Implementación |
|---|---|---|
| RF-001 a RF-005 | Menú/dashboard según el rol | Un panel por rol (`/administrador`, `/mesa-ayuda/panel`, `/tecnico`, `/instructor`, `/cuentadante`). |
| RF-002 | El cuentadante ve solo sus ambientes | Filtrado por `id_cuentadante` en Panel, Inventario, Ambientes y Reportes del cuentadante. |
| RF-003 | El técnico filtra por tipo de activo | Filtro en `Tecnico/MisTicketsTecnico.jsx`. |
| RF-006 | Registrar salida (daño/traslado/préstamo) | `SalidaEquipoForm.jsx` + campo `tipo_salida` en `tickets`. |
| RF-007 | Registrar entrada de equipo | Botón «Registrar entrada» (Mesa de Ayuda) y al marcar «atendido» (Técnico). |
| RF-008 | Consultar tickets con filtros por rol | Cada «Mis Tickets»/«Tickets». |
| RF-009 | Editar ticket pendiente / revertir «Dado de baja» | `EditarTicketPendienteModal.jsx` y botón «Revertir». |
| RF-010 | Notificar cambios de estado | Correos + registros en `notificaciones`. |
| RF-011 | Asignar y reasignar técnico | `AsignarTecnico.jsx` y `/tickets/{id}/asignar|reasignar|desasignar`. |
| RF-012 | Detalle e historial del ticket | `TicketDetailPanel.jsx`. |
| RF-013 | Historial de un equipo por serial | `HistorialEquiposCuentadante.jsx` + `/dashboard/historial-equipo/{serial}`. |
| RF-014 | Dashboard y reportes por rol | Paneles con Recharts + módulo de 12 reportes (PDF/Excel). |
| RF-015 | CRUD de ambientes | `AmbientesAdministrador.jsx`. |
| RF-016 | Pre-registro y activación por correo | `/usuarios/pre-registrar`, `/auth/confirmar-datos`, `/auth/activar-cuenta`. |
| RF-017 | Login seguro y cierre por inactividad | JWT + `useAutoLogout` (15 min). |
| RF-018 | Recuperar contraseña por correo | `/auth/solicitar-recuperacion`, `/auth/restablecer-contrasena`. |

**Decisión de diseño (RF-016):** al no haber una base externa del SENA conectada, el «pre-registro» lo hace el administrador desde `/administrador/usuarios`.

---

## 14. Seguridad: estado actual y recomendaciones

**Ya implementado**

- Contraseñas con **bcrypt**; `UsuarioLeer` nunca devuelve el hash.
- JWT con expiración y verificación del rol; tokens de activación/recuperación de **un solo propósito** con vencimiento corto.
- Respuestas **genéricas** en activación y recuperación (no revelan si un correo o documento existe) y alerta a los administradores ante datos que no coinciden.
- Validación de extensión de imagen (`.jpg`, `.jpeg`, `.png`) y del dominio del correo.
- CORS limitado a `localhost:5173` / `127.0.0.1:5173`.

**Recomendaciones antes de producción**

1. **Mover `CLAVE_SECRETA` a una variable de entorno.** Hoy está escrita directamente en `seguridad.py`; cualquiera que vea el repositorio puede firmar tokens válidos. Genera una nueva y rota la actual.
2. **Proteger los endpoints.** Solo `/auth/yo` y `/ambientes/mis-ambientes` exigen token. Tickets, usuarios, equipos, ambientes, catálogos, dashboard, notificaciones, historial y asignaciones están abiertos. Agrega `Depends(verificar_token)` y usa `solo_admin`/`solo_tecnico` donde corresponda (ya existen en `seguridad.py`). Esto incluye `POST /usuarios/` y `PUT /usuarios/{id}`, que hoy permitirían crear o escalar usuarios sin autenticación.
3. **No versionar `.env`.** Aunque `.gitignore` lo excluye, el ZIP lo incluía. Si alguna vez se subió, **rota las credenciales SMTP y el Client ID** y crea un `.env.example` sin valores.
4. **Credenciales de desarrollo** (base de datos en `docker-compose.yml`, usuarios de prueba) deben reemplazarse en cualquier entorno compartido.
5. **Limitar la subida de archivos:** además de la extensión, validar tamaño y tipo MIME.
6. **Quitar `print` de tokens.** `/auth/solicitar-recuperacion` imprime el token de recuperación en los logs; es útil en desarrollo pero debe eliminarse en producción.
7. **Login con Google:** el backend consulta `userinfo` con el *access token*; es funcional, pero conviene verificar además la audiencia (`aud`) del token.
8. Reemplazar `datetime.utcnow()` (obsoleto) por `datetime.now(timezone.utc)` y configurar CORS desde variable de entorno para despliegues.

---

## 15. Inconsistencias conocidas y pendientes

Detectadas al revisar el código; conviene corregirlas para que el sistema sea coherente de punta a punta.

| # | Hallazgo | Dónde | Sugerencia |
|---|---|---|---|
| 5 | `GET /ambientes/cuentadante/{id}` no existe; el frontend cae al filtro local cuando recibe 404. | `adminService.js` | Funciona, pero se puede usar `/ambientes/mis-ambientes`. |
| 6 | **URLs fijas** `http://localhost:8000` y `http://127.0.0.1:8000` repartidas entre `api.js`, `adminService.js` e `ImagenTicket.jsx`. | FrontEnd | Centralizar en una variable `VITE_API_URL`. |
| 7 | `ER_equipos.py` define `GET /` **dos veces** (la segunda, con filtro por ambiente, es la que queda efectiva según el orden de registro). | `ER_equipos.py` | Dejar una sola. |
| 8 | Hay dos módulos de correo (`correo.py` y `servicios/correo.py`) con variables distintas. | Backend | Unificarlos. |
| 9 | **Esquema desalineado:** el modelo `tickets` no declara `id_ambiente_destino`, `persona_prestamo` ni `fecha_fisica de devolución` (`fecha_devolucion`) que sí existen en `insert_datos.sql`. `base_de_datos.txt` es una versión anterior (sin `activo`, dominio de correo más estricto). El README original menciona `base_de_datos/migracion_rf.sql`, que **no está** en el ZIP. | `Modelos/tickets.py`, SQL | Alinear modelo y SQL; usar Alembic para migraciones. |
| 10 | `tickets.fecha_salida` es `NOT NULL` en el SQL pero opcional en el modelo. | SQL / modelo | Unificar. |
| 11 | El campo `tipo_salida` usa `'daño'` por defecto en SQL y `dano` (sin ñ) en el formulario. | SQL / `SalidaEquipoForm.jsx` | Unificar valores. |
| 12 | `notificaciones.enviada` se reutiliza como «leída» en el frontend. | `useNotificaciones.js` | Añadir un campo `leida`. |
| 13 | `BarraSuperior.jsx` enlaza a rutas que no existen (`/tickets/consultar`, `/ambientes`); parece código heredado. `RestablecerContrase#U00f1a.jsx` es un duplicado con nombre mal codificado de `RestablecerContrasena.jsx`. | FrontEnd | Eliminar los archivos sin uso. |
| 14 | `requierements_def.txt` (nombre con errata) incluye `dotenv` y `python-dotenv` a la vez, y librerías sin uso (Flask, drivers MySQL, Sentry…). `google-auth` aparece repetida. | Backend | Depurar con `pip-chill`/`pipreqs`. |
| 15 | Se versionaron `__pycache__/`, `node_modules/` y `uploads/` en el ZIP. El `.gitignore` no cubre `__pycache__`, `*.pyc` ni `uploads/`. | `.gitignore` | Ampliarlo. |
| 16 | `docker-compose.yml` monta el código como volumen y arranca con `--reload` / `vite dev`: pensado para desarrollo, no para producción. | Docker | Crear una configuración de producción (build estático + Nginx, sin `--reload`). |

---

## 16. Equipo de desarrollo

Proyecto del **SENA – CGMLTI**, desarrollado por el equipo mostrado en la página *Nosotros*:

- Camila
- Janer Rivas
- Alejandro Fuentes
- Esteban Castrillón

Repositorio: <https://github.com/camilahm1018-commits/Asis-Project->

---

*ASIS — Asistencia Integral SENA · Sistema de Gestión de Tickets.*



# Instalación y ejecución de ASIS

## 1. Descripción

**ASIS (Sistema de Administración y Seguimiento de Incidencias)** es una aplicación desarrollada para gestionar equipos, ambientes, usuarios, tickets y reportes de incidencias.

El proyecto utiliza las siguientes tecnologías:

- **FrontEnd:** React, Vite y JavaScript.
- **BackEnd:** Python y FastAPI.
- **Base de datos:** PostgreSQL.
- **Contenedores:** Docker y Docker Compose.

ASIS puede ejecutarse tanto en **Linux (Pop!_OS, Ubuntu y distribuciones compatibles)** como en **Windows mediante Docker Desktop**.

---

## 2. Requisitos previos

Antes de instalar el proyecto, es necesario contar con las siguientes herramientas:

| Herramienta | Linux | Windows |
|---|---|---|
| Git | Requerido | Requerido |
| Docker | Docker Engine | Docker Desktop |
| Docker Compose | Requerido | Incluido con Docker Desktop |
| Terminal | Bash | PowerShell |
| WSL 2 | No requerido | Recomendado para Docker Desktop |

**Nota:** Docker Desktop debe estar configurado para utilizar contenedores Linux.

---

## 3. Instalación en Linux

### Paso 1. Verificar Docker

Abrir una terminal y ejecutar:

```bash
docker --version
docker compose version
```

Los comandos deben mostrar las versiones instaladas.

### Paso 2. Clonar el repositorio

```bash
git clone https://github.com/camilahm1018-commits/Asis-Project-.git
```

Ingresar a la carpeta del proyecto:

```bash
cd Asis-Project-
```

Si el proyecto ya fue descargado, solamente es necesario ingresar a su directorio.

### Paso 3. Configurar las variables de entorno

Ejecutar el script de configuración para Linux:

```bash
bash scripts/preparar_env.sh
```

Este script está diseñado para preparar los archivos de configuración necesarios:

```text
Asis-Project-/
├── .env
├── Backend/
│   └── .env
└── FrontEnd/
    └── .env
```

Los archivos contienen las variables necesarias para las conexiones a PostgreSQL, la autenticación JWT y la configuración del sistema.

**Importante:** comprobar que las variables requeridas tengan valores válidos. Si ya existe una instalación con datos, deben conservarse las credenciales correspondientes.

### Paso 4. Validar Docker Compose

```bash
sudo docker compose config --quiet
```

Si el comando no muestra errores, la configuración de Docker Compose es válida.

### Paso 5. Construir e iniciar los contenedores

```bash
sudo docker compose up -d --build
```

Este comando construye las imágenes necesarias e inicia los servicios de la aplicación.

### Paso 6. Verificar los servicios

```bash
sudo docker compose ps
```

Se espera encontrar los siguientes contenedores en ejecución:

```text
asis_backend
asis_db
asis_frontend
```

### Paso 7. Acceder a ASIS

Abrir un navegador e ingresar a:

| Servicio | Dirección |
|---|---|
| Aplicación web | http://localhost:5173 |
| API FastAPI | http://localhost:8000 |
| Documentación Swagger | http://localhost:8000/docs |

---

## 4. Instalación en Windows

### Paso 1. Iniciar Docker Desktop

Abrir Docker Desktop y comprobar que el motor de Docker se encuentre funcionando.

Posteriormente, abrir PowerShell y ejecutar:

```powershell
docker --version
docker compose version
```

### Paso 2. Clonar el repositorio

Desde PowerShell, ingresar al directorio donde se desea guardar el proyecto y ejecutar:

```powershell
git clone https://github.com/camilahm1018-commits/Asis-Project-.git
```

Ingresar a la carpeta:

```powershell
cd Asis-Project-
```

### Paso 3. Configurar las variables de entorno

Para Windows se utiliza el script de PowerShell:

```text
scripts/preparar_env.ps1
```

Verificar que el archivo exista:

```powershell
Test-Path .\scripts\preparar_env.ps1
```

Si devuelve `True`, ejecutar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\preparar_env.ps1
```

El script permite preparar los archivos `.env` necesarios para configurar las variables privadas de ASIS.

**Nota:** si el archivo `preparar_env.ps1` no está incluido en el repositorio, deberá incorporarse antes de ejecutar este paso. El archivo `.sh` es la versión para Bash y no se ejecuta directamente en PowerShell.

### Paso 4. Validar Docker Compose

```powershell
docker compose config --quiet
```

Si no aparecen errores, continuar con la instalación.

### Paso 5. Construir e iniciar los contenedores

```powershell
docker compose up -d --build
```

### Paso 6. Verificar los servicios

```powershell
docker compose ps
```

Los servicios `backend`, `db` y `frontend` deben encontrarse en ejecución.

### Paso 7. Acceder a ASIS

Desde el navegador, ingresar a:

| Servicio | Dirección |
|---|---|
| Aplicación web | http://localhost:5173 |
| API FastAPI | http://localhost:8000 |
| Documentación Swagger | http://localhost:8000/docs |

---

## 5. Administración de los contenedores

Después de la instalación inicial, no es necesario ejecutar nuevamente los scripts de configuración cada vez que se inicia el proyecto.

### Linux

**Iniciar ASIS:**

```bash
sudo docker compose up -d
```

**Detener ASIS:**

```bash
sudo docker compose down
```

**Comprobar contenedores:**

```bash
sudo docker compose ps
```

**Reconstruir el proyecto después de modificar su código:**

```bash
sudo docker compose up -d --build
```

**Consultar registros de los servicios:**

```bash
sudo docker compose logs --tail=50 backend db frontend
```

### Windows

**Iniciar ASIS:**

```powershell
docker compose up -d
```

**Detener ASIS:**

```powershell
docker compose down
```

**Comprobar contenedores:**

```powershell
docker compose ps
```

**Reconstruir el proyecto:**

```powershell
docker compose up -d --build
```

**Consultar registros de los servicios:**

```powershell
docker compose logs --tail=50 backend db frontend
```

Todos estos comandos deben ejecutarse desde la carpeta principal del proyecto, donde se encuentra `docker-compose.yml`.

---

## 6. Configuración de los archivos `.env`

ASIS utiliza archivos de entorno para administrar las variables de configuración de manera independiente del código fuente.

| Archivo | Función |
|---|---|
| `.env` | Credenciales de PostgreSQL, cuentas técnicas, clave JWT y administrador inicial |
| `Backend/.env` | Configuración del servidor, correo electrónico y servicios del Backend |
| `FrontEnd/.env` | Variables de configuración del FrontEnd |

### Consideraciones de seguridad

- No publicar archivos `.env` con credenciales reales en GitHub.
- Utilizar `.env.example` como plantilla de configuración.
- Generar claves privadas seguras para cada instalación.
- Conservar las contraseñas asociadas a una base de datos PostgreSQL existente.
- No modificar la clave JWT de una instalación activa sin considerar que los tokens existentes dejarán de ser válidos.

En una instalación nueva, la contraseña inicial del administrador se define mediante la variable `ASIS_INITIAL_ADMIN_PASSWORD`, cuando el mecanismo de inicialización está habilitado.

**El archivo `.env` debe configurarse una sola vez por instalación**, salvo que sea necesario modificar sus variables.

---

## 7. Actualización del proyecto

Para descargar los cambios más recientes del repositorio, ejecutar desde la rama correspondiente:

```bash
git pull
```

En Windows se utiliza el mismo comando.

Posteriormente, reconstruir los contenedores.

**Linux:**

```bash
sudo docker compose up -d --build
```

**Windows:**

```powershell
docker compose up -d --build
```

Antes de actualizar una instalación que ya contiene información, es recomendable realizar un respaldo de PostgreSQL y revisar posibles cambios en los scripts de la base de datos.

---

## 8. Solución de problemas frecuentes

### Error: `ASIS_JWT_SECRET is missing a value`

**Causa:** la variable de autenticación JWT no está configurada o se encuentra vacía.

**Solución:** comprobar el archivo `.env` principal, configurar una clave JWT segura y validar nuevamente Docker Compose.

### Error: `no configuration file provided: not found`

**Causa:** Docker Compose se está ejecutando fuera del directorio del proyecto.

**Solución:** ingresar a la carpeta donde se encuentra `docker-compose.yml` y volver a ejecutar el comando.

### El FrontEnd no puede conectarse al Backend

Comprobar el estado de los contenedores y verificar que las variables de conexión a la API estén correctamente configuradas.

También revisar la disponibilidad de:

```text
http://localhost:8000/docs
```

### PostgreSQL no inicia correctamente

Consultar los registros del servicio:

**Linux:**

```bash
sudo docker compose logs --tail=100 db
```

**Windows:**

```powershell
docker compose logs --tail=100 db
```

Revisar las credenciales, los volúmenes y los scripts de inicialización.

### Error de permisos de Docker en Linux

Si aparece un error relacionado con el acceso al socket de Docker, ejecutar los comandos con `sudo` o configurar los permisos del usuario según la documentación oficial de Docker.

---

## 9. Recomendaciones importantes

1. No ejecutar `docker compose down -v` sin disponer de un respaldo, ya que puede eliminar los volúmenes de PostgreSQL.
2. Mantener los archivos `.env` fuera del control de versiones.
3. Realizar respaldos antes de modificar la estructura de la base de datos.
4. Ejecutar las pruebas automatizadas en un entorno independiente antes de aplicar cambios importantes.
5. Verificar el funcionamiento de los servicios antes de utilizar ASIS.

---

## 10. Resumen de instalación rápida

### Linux (Pop!_OS)

```bash
git clone https://github.com/camilahm1018-commits/Asis-Project-.git
cd Asis-Project-
bash scripts/preparar_env.sh
sudo docker compose config --quiet
sudo docker compose up -d --build
sudo docker compose ps
```

### Windows (PowerShell)

```powershell
git clone https://github.com/camilahm1018-commits/Asis-Project-.git
cd Asis-Project-
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\preparar_env.ps1
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

**Nota:** estos procedimientos presuponen que Docker está instalado, que los scripts existen y que las variables privadas de la instalación se encuentran correctamente configuradas.

Una vez iniciados los servicios, la aplicación estará disponible en:

**http://localhost:5173**

---

*Proyecto ASIS — Sistema de Administración y Seguimiento de Incidencias.*