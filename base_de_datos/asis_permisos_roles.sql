-- ASIS - Etapa 4: permisos iniciales de PostgreSQL por perfil.
-- Basado en base_de_datos/insert_datos.sql del proyecto.
-- Ejecutar como postgres con psql -v ON_ERROR_STOP=1 -1.
-- No sustituye las autorizaciones por usuario en FastAPI ni las politicas RLS.
-- No modificar todavia los enrutadores a Sesion_por_rol hasta adaptarlos.

-- Los roles funcionales ya deben existir por z_roles_postgres.sql.
GRANT USAGE ON SCHEMA public TO
    instructor, tecnico, administrador_mesa_ayuda, cuentadante;

-- Restablecer permisos de estos cuatro roles del proyecto para que
-- este archivo se pueda volver a aplicar sin acumular privilegios.
-- No afecta los permisos de administrador ni asis_app_auth.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM
    instructor, tecnico, administrador_mesa_ayuda, cuentadante;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM
    instructor, tecnico, administrador_mesa_ayuda, cuentadante;

-- Catalogos y datos de consulta que necesitan los cuatro perfiles.
GRANT SELECT ON TABLE
    public.rol,
    public.tipo_identificacion,
    public.ambientes,
    public.equipos,
    public.tipo_equipo,
    public.estados_ticket,
    public.motivo_novedad
TO instructor, tecnico, administrador_mesa_ayuda, cuentadante;

-- Usuarios: nombres e identificadores para vistas resumen de React.
-- NO conceder SELECT general: proteger documento, correo y hash de clave.
GRANT SELECT (id_usuario, nombre_u, apellidos_u)
ON TABLE public.usuarios
TO instructor, tecnico, administrador_mesa_ayuda, cuentadante;

-- La validacion de tecnicos activos necesitara tambien estos campos.
-- La consulta de FastAPI debe seleccionar solo columnas autorizadas.
GRANT SELECT (id_rol, activo)
ON TABLE public.usuarios
TO tecnico, administrador_mesa_ayuda;

-- Tickets: se consultan en los cuatro perfiles, pero el backend debe
-- limitar las filas visibles al usuario autenticado.
GRANT SELECT ON TABLE public.tickets
TO instructor, tecnico, administrador_mesa_ayuda, cuentadante;

-- INSTRUCTOR: crear reportes, editar pendientes y confirmar devoluciones de préstamos propios.
GRANT INSERT ON TABLE public.tickets TO instructor;
GRANT UPDATE (motivo, id_equipo, imagen, id_estado, atendido, fecha_retorno)
ON TABLE public.tickets TO instructor;
GRANT USAGE ON SEQUENCE public.tickets_id_ticket_seq TO instructor;

-- TECNICO: atender un ticket propio y tomar tickets disponibles.
-- Las condiciones de pertenencia/estado deben verificarse en FastAPI.
GRANT UPDATE (id_estado, atendido, fecha_retorno, asignado_a)
ON TABLE public.tickets TO tecnico;
GRANT SELECT, INSERT ON TABLE public.asignacion_tecnico TO tecnico;
GRANT USAGE ON SEQUENCE public.asignacion_tecnico_id_asignacion_seq TO tecnico;

-- MESA DE AYUDA: actualizar incidencias y administrar asignaciones.
GRANT UPDATE (
    motivo, fecha_salida, fecha_retorno, atendido, id_equipo,
    id_estado, id_motivo_novedad, tipo_salida, asignado_a
) ON TABLE public.tickets TO administrador_mesa_ayuda;
GRANT SELECT, INSERT ON TABLE public.asignacion_tecnico
TO administrador_mesa_ayuda;
GRANT USAGE ON SEQUENCE public.asignacion_tecnico_id_asignacion_seq
TO administrador_mesa_ayuda;

-- CUENTADANTE: gestionar inventario y salidas de equipo.
GRANT INSERT, UPDATE ON TABLE public.equipos TO cuentadante;
GRANT USAGE ON SEQUENCE public.equipos_id_equipo_seq TO cuentadante;
GRANT INSERT ON TABLE public.tickets TO cuentadante;
GRANT UPDATE (
    tipo_salida, id_ambiente_destino, persona_prestamo,
    fecha_devolucion, fecha_retorno, id_estado, atendido
) ON TABLE public.tickets TO cuentadante;
GRANT USAGE ON SEQUENCE public.tickets_id_ticket_seq TO cuentadante;

-- Historial: registros de eventos; ningun perfil operativo los borra.
GRANT SELECT ON TABLE public.historial_tickets
TO instructor, tecnico, administrador_mesa_ayuda, cuentadante;
GRANT INSERT ON TABLE public.historial_tickets
TO instructor, tecnico, administrador_mesa_ayuda, cuentadante;
GRANT USAGE ON SEQUENCE public.historial_tickets_id_historial_seq
TO instructor, tecnico, administrador_mesa_ayuda, cuentadante;

-- Vistas de reportes agregados; revisar visibilidad por usuario en FastAPI.
GRANT SELECT ON TABLE
    public.vista_tickets_por_mes,
    public.vista_tickets_por_estado,
    public.vista_danos_por_ambiente,
    public.vista_motivos_novedad,
    public.vista_tickets_por_tipo,
    public.vista_historial_equipo
TO administrador_mesa_ayuda;

GRANT SELECT ON TABLE
    public.vista_danos_por_ambiente,
    public.vista_historial_equipo
TO cuentadante;

-- Los perfiles operativos no tienen permisos de borrado.

-- Ajustes de integración FastAPI / React.
-- Mesa: lista de técnicos con correo de contacto, no hash/documento.
GRANT SELECT (correo_u) ON TABLE public.usuarios TO administrador_mesa_ayuda;
-- Instructor puede marcar como dañado únicamente el equipo recién reportado;
-- el endpoint verifica rol, ticket creador y ventana de tiempo.
GRANT UPDATE (estado) ON TABLE public.equipos TO instructor;
-- Imágenes de reportes subidas después de la inserción inicial.
GRANT UPDATE (imagen) ON TABLE public.tickets TO cuentadante;
-- Notificaciones: lectura y marcar propia leída; escritura por técnico/mesa.
GRANT SELECT ON TABLE public.notificaciones TO
    instructor, tecnico, administrador_mesa_ayuda, cuentadante;
GRANT UPDATE (enviada) ON TABLE public.notificaciones TO
    instructor, tecnico, administrador_mesa_ayuda, cuentadante;
GRANT INSERT ON TABLE public.notificaciones TO tecnico, administrador_mesa_ayuda;
GRANT USAGE ON SEQUENCE public.notificaciones_id_notificacion_seq
TO tecnico, administrador_mesa_ayuda;

-- MOBILIARIO (sillas y mesa del instructor): mismos permisos que equipos.
GRANT SELECT ON TABLE public.tipo_mobiliario
TO instructor, tecnico, administrador_mesa_ayuda, cuentadante;
GRANT SELECT ON TABLE public.mobiliario
TO instructor, tecnico, administrador_mesa_ayuda, cuentadante;
GRANT INSERT, UPDATE ON TABLE public.mobiliario TO cuentadante;
GRANT USAGE ON SEQUENCE public.mobiliario_id_mobiliario_seq TO cuentadante;
-- El instructor solo cambia el estado (al reportar un daño).
GRANT UPDATE (estado) ON TABLE public.mobiliario TO instructor;

-- Préstamos: instructor y cuentadante eligen a qué instructor se presta.
-- Solo ven el rol y si está activo; no el documento, el correo ni la clave.
GRANT SELECT (id_rol, activo) ON TABLE public.usuarios
TO instructor, cuentadante;

GRANT UPDATE (fecha_reasignacion, fecha_desasignacion)
ON TABLE public.asignacion_tecnico
TO administrador_mesa_ayuda;