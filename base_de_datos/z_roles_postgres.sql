
-- =====================================================
-- ASIS - ROLES NATIVOS Y CUENTAS TECNICAS POSTGRESQL
-- PostgreSQL 15
-- =====================================================

-- 1. CREAR LOS CINCO ROLES DE GRUPO

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'administrador') THEN
        CREATE ROLE administrador NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'instructor') THEN
        CREATE ROLE instructor NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tecnico') THEN
        CREATE ROLE tecnico NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'administrador_mesa_ayuda') THEN
        CREATE ROLE administrador_mesa_ayuda NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cuentadante') THEN
        CREATE ROLE cuentadante NOLOGIN;
    END IF;
END
$$;


-- 2. LEER LAS CONTRASEÑAS DESDE EL ENTORNO DEL CONTENEDOR

\getenv auth_password ASIS_DB_AUTH_PASSWORD
\getenv admin_password ASIS_DB_ADMIN_PASSWORD
\getenv instructor_password ASIS_DB_INSTRUCTOR_PASSWORD
\getenv tecnico_password ASIS_DB_TECNICO_PASSWORD
\getenv mesa_password ASIS_DB_MESA_PASSWORD
\getenv cuentadante_password ASIS_DB_CUENTADANTE_PASSWORD


-- 3. CREAR CUENTAS TECNICAS

SELECT format(
    'CREATE ROLE asis_app_auth LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L',
    :'auth_password'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'asis_app_auth'
)
\gexec


SELECT format(
    'CREATE ROLE asis_app_admin LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L',
    :'admin_password'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'asis_app_admin'
)
\gexec


SELECT format(
    'CREATE ROLE asis_app_instructor LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L',
    :'instructor_password'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'asis_app_instructor'
)
\gexec


SELECT format(
    'CREATE ROLE asis_app_tecnico LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L',
    :'tecnico_password'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'asis_app_tecnico'
)
\gexec


SELECT format(
    'CREATE ROLE asis_app_mesa LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L',
    :'mesa_password'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'asis_app_mesa'
)
\gexec


SELECT format(
    'CREATE ROLE asis_app_cuentadante LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L',
    :'cuentadante_password'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'asis_app_cuentadante'
)
\gexec


-- 4. ASIGNAR CADA CUENTA TECNICA A SU ROL DE GRUPO

GRANT administrador TO asis_app_admin;
GRANT instructor TO asis_app_instructor;
GRANT tecnico TO asis_app_tecnico;
GRANT administrador_mesa_ayuda TO asis_app_mesa;
GRANT cuentadante TO asis_app_cuentadante;


-- 5. PERMITIR CONEXION A LA BASE DE DATOS

GRANT CONNECT ON DATABASE asisdb TO
    asis_app_auth,
    asis_app_admin,
    asis_app_instructor,
    asis_app_tecnico,
    asis_app_mesa,
    asis_app_cuentadante;


-- 6. ACCESO AL ESQUEMA

GRANT USAGE ON SCHEMA public TO
    administrador,
    instructor,
    tecnico,
    administrador_mesa_ayuda,
    cuentadante,
    asis_app_auth;


-- 7. PRIVILEGIOS DEL ADMINISTRADOR

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public
TO administrador;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
TO administrador;

-- Privilegios para tablas y secuencias futuras
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO administrador;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL PRIVILEGES ON SEQUENCES TO administrador;


-- 8. PRIVILEGIOS LIMITADOS PARA AUTENTICACION

GRANT SELECT ON TABLE public.usuarios, public.rol
TO asis_app_auth;

GRANT UPDATE (contrasena_u, activo)
ON TABLE public.usuarios
TO asis_app_auth;


-- =====================================================
-- FIN DE CONFIGURACION INICIAL
-- =====================================================
