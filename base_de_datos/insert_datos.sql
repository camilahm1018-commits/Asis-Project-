-- ==========================================
-- BASE DE DATOS ASIS
-- Sistema de Gestión de Tickets - CGMLTI
-- ==========================================
-- ==========================================
-- TABLA: tipo_identificacion
-- ==========================================
CREATE TABLE tipo_identificacion(
    id_tipo_id SERIAL PRIMARY KEY,
    iniciales VARCHAR(5) NOT NULL,
    nombre_tipo VARCHAR(50) NOT NULL
);

-- ==========================================
-- TABLA: rol
-- ==========================================
CREATE TABLE rol(
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

-- ==========================================
-- TABLA: usuarios
-- ==========================================
CREATE TABLE usuarios(
    id_usuario SERIAL PRIMARY KEY,
    nombre_u VARCHAR(50) NOT NULL,
    apellidos_u VARCHAR(100) NOT NULL,
    correo_u VARCHAR(100) NOT NULL UNIQUE,
    contrasena_u VARCHAR(255) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    telefono_u VARCHAR(20),
    creado_en TIMESTAMP DEFAULT NOW(),
    id_rol INT NOT NULL,
    id_tipo_identificacion INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,


    CONSTRAINT restriccion_correo
    CHECK (
        correo_u ~* '^[A-Za-z0-9._%+-]+@sena\.edu\.co$' 
        OR 
        correo_u ~* '^[A-Za-z0-9._%+-]+@gmail\.com$'
        OR 
        correo_u ~* '^[A-Za-z0-9._%+-]+@soy\.sena\.edu\.co$' 
    ),

    CONSTRAINT fk_usuario_tipo_id
    FOREIGN KEY(id_tipo_identificacion)
    REFERENCES tipo_identificacion(id_tipo_id),

    CONSTRAINT fk_usuario_rol
    FOREIGN KEY(id_rol)
    REFERENCES rol(id_rol)
);

-- ==========================================
-- TABLA: ambientes
-- ==========================================
CREATE TABLE ambientes(
    id_ambiente INT PRIMARY KEY,
    nombre_a VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(100) NOT NULL,
    capacidad_equipos INT,
    estado VARCHAR(20) DEFAULT 'activo',
    descripcion TEXT,
    id_cuentadante INT,
 
    CONSTRAINT fk_ambiente_cuentadante
    FOREIGN KEY(id_cuentadante)
    REFERENCES usuarios(id_usuario)
);
 
-- ==========================================
-- TABLA: tipo_equipo
-- ==========================================
CREATE TABLE tipo_equipo(
    id_tipo SERIAL PRIMARY KEY,
    nombre_t VARCHAR(100) NOT NULL
);
 
-- ==========================================
-- TABLA: equipos
-- ==========================================
CREATE TABLE equipos(
    id_equipo SERIAL PRIMARY KEY,
    codigo VARCHAR(25) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    marca VARCHAR(100),
    serial VARCHAR(100) UNIQUE,
    descripcion TEXT,
    estado VARCHAR(50) NOT NULL,
    id_ambiente INT NOT NULL,
    id_tipo INT NOT NULL,
 
    CONSTRAINT fk_equipo_ambiente
    FOREIGN KEY(id_ambiente)
    REFERENCES ambientes(id_ambiente),
 
    CONSTRAINT fk_equipo_tipo
    FOREIGN KEY(id_tipo)
    REFERENCES tipo_equipo(id_tipo)
);

-- ==========================================
-- TABLA: tipo_mobiliario
-- ==========================================
CREATE TABLE tipo_mobiliario(
    id_tipo_mob SERIAL PRIMARY KEY,
    nombre_tm VARCHAR(100) NOT NULL
);

-- ==========================================
-- TABLA: mobiliario
-- ==========================================
CREATE TABLE mobiliario(
    id_mobiliario SERIAL PRIMARY KEY,
    codigo VARCHAR(25) NOT NULL,
    serial VARCHAR(100) UNIQUE,
    descripcion TEXT,
    estado VARCHAR(50) NOT NULL,
    id_ambiente INT NOT NULL,
    id_tipo_mob INT NOT NULL,

    CONSTRAINT fk_mobiliario_ambiente
    FOREIGN KEY(id_ambiente)
    REFERENCES ambientes(id_ambiente),

    CONSTRAINT fk_mobiliario_tipo
    FOREIGN KEY(id_tipo_mob)
    REFERENCES tipo_mobiliario(id_tipo_mob)
);
-- ==========================================
-- TABLA: estados_ticket
-- ==========================================
CREATE TABLE estados_ticket(
    id_estado SERIAL PRIMARY KEY,
    nombre_e VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL
);
 
-- ==========================================
-- TABLA: motivo_novedad
-- ==========================================
CREATE TABLE motivo_novedad(
    id_motivo SERIAL PRIMARY KEY,
    nombre_novedad VARCHAR(100) NOT NULL
);
 
-- ==========================================
-- TABLA: tickets (CON CAMPOS RF-006 INCLUIDOS)
-- ==========================================
CREATE TABLE tickets (
    id_ticket SERIAL PRIMARY KEY,
    motivo TEXT NOT NULL,
    fecha_salida TIMESTAMP NOT NULL,
    fecha_retorno TIMESTAMP,
    creado_en TIMESTAMP DEFAULT NOW(),
    atendido BOOLEAN DEFAULT FALSE,
    id_equipo INT,
    id_mobiliario INT,
    creado_por INT NOT NULL,
    asignado_a INT,
    id_estado INT NOT NULL,
    id_motivo_novedad INT,
    imagen VARCHAR,

    -- 👇 CAMPOS RF-006 (Registrar Salida de Equipo)
    tipo_salida VARCHAR(20) DEFAULT 'daño',
    id_ambiente_destino INT,
    persona_prestamo VARCHAR(100),
    fecha_devolucion DATE,
    id_ambiente_origen INT,
    traslado_definitivo BOOLEAN,
    id_instructor_prestamo INT,
 
    CONSTRAINT fk_ticket_equipo
    FOREIGN KEY(id_equipo)
    REFERENCES equipos(id_equipo),
 
    CONSTRAINT fk_ticket_creador
    FOREIGN KEY(creado_por)
    REFERENCES usuarios(id_usuario),
 
    CONSTRAINT fk_ticket_asignado
    FOREIGN KEY(asignado_a)
    REFERENCES usuarios(id_usuario),
 
    CONSTRAINT fk_ticket_estado
    FOREIGN KEY(id_estado)
    REFERENCES estados_ticket(id_estado),
    
    CONSTRAINT fk_ticket_motivo
    FOREIGN KEY(id_motivo_novedad)
    REFERENCES motivo_novedad(id_motivo),

    CONSTRAINT fk_ticket_mobiliario
    FOREIGN KEY(id_mobiliario)
    REFERENCES mobiliario(id_mobiliario),

    CONSTRAINT chk_ticket_item CHECK (
        (id_equipo IS NOT NULL AND id_mobiliario IS NULL)
        OR
        (id_equipo IS NULL AND id_mobiliario IS NOT NULL)
    ),
    CONSTRAINT fk_ticket_ambiente_origen
    FOREIGN KEY(id_ambiente_origen)
    REFERENCES ambientes(id_ambiente),

    CONSTRAINT fk_ticket_ambiente_destino
    FOREIGN KEY(id_ambiente_destino)
    REFERENCES ambientes(id_ambiente),

    CONSTRAINT fk_ticket_instructor_prestamo
    FOREIGN KEY(id_instructor_prestamo)
    REFERENCES usuarios(id_usuario),

    CONSTRAINT chk_traslado_definitivo
    CHECK (traslado_definitivo IS NULL OR tipo_salida = 'traslado')
);

-- ==========================================
-- TABLA: asignacion_tecnico
-- ==========================================
CREATE TABLE asignacion_tecnico(
    id_asignacion SERIAL PRIMARY KEY,
    fecha_asignacion TIMESTAMP DEFAULT NOW(),
    id_ticket INT NOT NULL,
    id_tecnico INT NOT NULL,
    asignado_por INT NOT NULL,
 
    CONSTRAINT fk_asignacion_ticket
    FOREIGN KEY(id_ticket)
    REFERENCES tickets(id_ticket),
 
    CONSTRAINT fk_asignacion_tecnico
    FOREIGN KEY(id_tecnico)
    REFERENCES usuarios(id_usuario),
 
    CONSTRAINT fk_asignado_por
    FOREIGN KEY(asignado_por)
    REFERENCES usuarios(id_usuario)
);
 
-- ==========================================
-- TABLA: notificaciones
-- ==========================================
CREATE TABLE notificaciones(
    id_notificacion SERIAL PRIMARY KEY,
    canal VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    enviada BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP DEFAULT NOW(),
    id_ticket INT NOT NULL,
    notificado_para INT NOT NULL,
    notificado_por INT NOT NULL,
 
    CONSTRAINT fk_notificacion_ticket
    FOREIGN KEY(id_ticket)
    REFERENCES tickets(id_ticket),
 
    CONSTRAINT fk_notificado_para
    FOREIGN KEY(notificado_para)
    REFERENCES usuarios(id_usuario),
 
    CONSTRAINT fk_notificado_por
    FOREIGN KEY(notificado_por)
    REFERENCES usuarios(id_usuario)
);
 
-- ==========================================
-- TABLA: historial_tickets
-- ==========================================
CREATE TABLE historial_tickets(
    id_historial SERIAL PRIMARY KEY,
    accion VARCHAR(100) NOT NULL,
    observacion TEXT,
    fecha TIMESTAMP DEFAULT NOW(),
    estado_resultante VARCHAR(50),
    id_ticket INT NOT NULL,
    id_usuario INT NOT NULL,
 
    CONSTRAINT fk_historial_ticket
    FOREIGN KEY(id_ticket)
    REFERENCES tickets(id_ticket),
 
    CONSTRAINT fk_historial_usuario
    FOREIGN KEY(id_usuario)
    REFERENCES usuarios(id_usuario)
);
 
-- ==========================================
-- VISTAS PARA DASHBOARD DE REPORTES
-- ==========================================
CREATE VIEW vista_tickets_por_mes AS
SELECT
    DATE_TRUNC('month', creado_en) AS mes,
    COUNT(*) AS total_tickets
FROM tickets
GROUP BY mes
ORDER BY mes;
 
CREATE VIEW vista_tickets_por_estado AS
SELECT
    et.nombre_e AS estado,
    et.color,
    COUNT(*) AS total
FROM tickets t
JOIN estados_ticket et ON t.id_estado = et.id_estado
GROUP BY et.nombre_e, et.color
ORDER BY total DESC;
 
CREATE VIEW vista_danos_por_ambiente AS
SELECT
    a.nombre_a AS ambiente,
    a.id_ambiente,
    COUNT(*) AS total_tickets
FROM tickets t
JOIN equipos e ON t.id_equipo = e.id_equipo
JOIN ambientes a ON e.id_ambiente = a.id_ambiente
GROUP BY a.nombre_a, a.id_ambiente
ORDER BY total_tickets DESC;
 
CREATE VIEW vista_motivos_novedad AS
SELECT
    mn.nombre_novedad AS motivo,
    COUNT(*) AS total
FROM tickets t
JOIN motivo_novedad mn ON t.id_motivo_novedad = mn.id_motivo
WHERE t.id_motivo_novedad IS NOT NULL
GROUP BY mn.nombre_novedad
ORDER BY total DESC;
 
CREATE VIEW vista_tickets_por_tipo AS
SELECT
    tp.nombre_t AS tipo,
    COUNT(*) AS total
FROM tickets t
JOIN equipos e ON t.id_equipo = e.id_equipo
JOIN tipo_equipo tp ON e.id_tipo = tp.id_tipo
GROUP BY tp.nombre_t
ORDER BY total DESC;
 
CREATE VIEW vista_historial_equipo AS
SELECT
    e.serial,
    e.nombre AS equipo,
    e.codigo,
    t.motivo,
    h.fecha,
    h.accion,
    h.observacion,
    h.estado_resultante,
    u.nombre_u AS realizado_por
FROM historial_tickets h
JOIN tickets t ON h.id_ticket = t.id_ticket
JOIN equipos e ON t.id_equipo = e.id_equipo
JOIN usuarios u ON h.id_usuario = u.id_usuario
ORDER BY h.fecha DESC;
 
CREATE VIEW vista_historial_usuario AS
SELECT
    u.id_usuario,
    u.nombre_u,
    u.apellidos_u,
    h.fecha,
    h.accion,
    h.observacion,
    h.estado_resultante,
    t.motivo,
    e.nombre AS equipo,
    e.codigo
FROM historial_tickets h
JOIN tickets t ON h.id_ticket = t.id_ticket
JOIN equipos e ON t.id_equipo = e.id_equipo
JOIN usuarios u ON h.id_usuario = u.id_usuario
ORDER BY h.fecha DESC;

-- ==========================================
-- DATOS INICIALES
-- ==========================================

-- ==========================================================
-- ASIS - DATOS DE PRUEBA PARA POSTGRESQL
-- Sistema de Gestión de Tickets - CGMLTI
-- ==========================================================
-- IMPORTANTE:
-- 1. Este archivo corresponde a DATOS SEMILLA; las tablas y vistas deben
--    estar creadas previamente por el script de estructura de ASIS.
-- 2. Ejecutar una sola vez sobre tablas vacías.
-- 3. Los nombres, documentos y correos son FICTICIOS. Los teléfonos quedan vacíos.
-- 4. La contraseña de todos los usuarios será: AsisDemo2026*
--    Se almacena como hash bcrypt mediante pgcrypto (costo 12).
-- 5. No volver a ejecutar sobre una base que ya tenga estos registros.
-- ==========================================================

BEGIN;

-- Necesario para generar hashes bcrypt compatibles con aplicaciones
-- que validan contraseñas con bcrypt.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================================
-- 1. DATOS INICIALES OBLIGATORIOS
-- ==========================================================

INSERT INTO tipo_identificacion (iniciales, nombre_tipo) VALUES
('CC', 'Cédula de Ciudadanía'),
('CE', 'Cédula de Extranjería'),
('TI', 'Tarjeta de Identidad'),
('RC', 'Registro Civil'),
('PAS', 'Pasaporte'),
('NIT', 'Número de Identificación Tributaria'),
('PEP', 'Permiso Especial de Permanencia'),
('PPT', 'Permiso por Protección Temporal');

INSERT INTO rol(nombre_rol) VALUES
('instructor'),
('tecnico'),
('administrador'),
('cuentadante'),
('administrador_mesa_ayuda');

INSERT INTO estados_ticket(nombre_e, color) VALUES
('Pendiente', 'rojo'),
('En reparacion', 'naranja'),
('Reparado', 'amarillo'),
('Entregado en ambiente', 'verde'),
('Dado de baja', 'negro'),
('Inactivar ticket', 'morado'),
('Trasladado', 'azul');

INSERT INTO tipo_equipo(nombre_t) VALUES
('Computador'),
('Portatil'),
('Televisor'),
('Cargador'),
('All In One'),
('Computador de Mesa'),
('Laptop'),
('TV');

INSERT INTO tipo_mobiliario(nombre_tm) VALUES
('Silla'),
('Mesa instructor');
-- ==========================================================
-- 2. MOTIVOS DE NOVEDAD
-- ==========================================================

INSERT INTO motivo_novedad(nombre_novedad) VALUES
('Falla de hardware'),
('Falla de software'),
('Problema de conectividad'),
('Daño físico'),
('Mantenimiento preventivo'),
('Actualización de software'),
('Problema de alimentación eléctrica'),
('Solicitud de revisión'),
('Traslado de equipo'),
('Préstamo de equipo');

-- ==========================================================
-- 3. USUARIOS FICTICIOS
-- 12 cuentadantes, 10 instructores, 6 técnicos,
-- 1 administrador y 1 administrador de mesa de ayuda.
-- ==========================================================

INSERT INTO usuarios
(nombre_u, apellidos_u, correo_u, contrasena_u, numero_documento,
 telefono_u, id_rol, id_tipo_identificacion, activo)
VALUES
-- cuentadantes
('Laura', 'Martínez Rojas', 'laura.martinez01@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000001', '3000000001', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Andrés', 'Gómez Torres', 'andres.gomez02@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000002', '3000000002', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Diana', 'Rodríguez Pérez', 'diana.rodriguez03@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000003', '3000000003', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Carlos', 'Hernández López', 'carlos.hernandez04@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000004', '3000000004', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Natalia', 'Ramírez Díaz', 'natalia.ramirez05@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000005', '3000000005', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Julián', 'Castro Moreno', 'julian.castro06@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000006', '3000000006', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Paola', 'Vargas Silva', 'paola.vargas07@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000007', '3000000007', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Miguel', 'Ortiz Romero', 'miguel.ortiz08@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000008', '3000000008', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Valentina', 'Morales Ruiz', 'valentina.morales09@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000009', '3000000009', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Felipe', 'Jiménez Acosta', 'felipe.jimenez10@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000010', '3000000010', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Camila', 'Suárez Méndez', 'camila.suarez11@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000011', '3000000011', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Santiago', 'Navarro León', 'santiago.navarro12@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000012', '3000000012', (SELECT id_rol FROM rol WHERE nombre_rol='cuentadante'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),

-- instructores
('María', 'Fernández Castro', 'maria.fernandez13@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000013', '3000000013', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('David', 'Pardo Sánchez', 'david.pardo14@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000014', '3000000014', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Andrea', 'Cárdenas Gil', 'andrea.cardenas15@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000015', '3000000015', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Sebastián', 'Rojas Vega', 'sebastian.rojas16@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000016', '3000000016', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Paula', 'Mendoza Ortiz', 'paula.mendoza17@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000017', '3000000017', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Juan', 'Bautista Reyes', 'juan.bautista18@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000018', '3000000018', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Daniela', 'Peña Vargas', 'daniela.pena19@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000019', '3000000019', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Óscar', 'Medina Cruz', 'oscar.medina20@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000020', '3000000020', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Luisa', 'Herrera Campos', 'luisa.herrera21@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000021', '3000000021', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Nicolás', 'Duarte Rincón', 'nicolas.duarte22@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000022', '3000000022', (SELECT id_rol FROM rol WHERE nombre_rol='instructor'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),

-- Técnicos
('Kevin', 'Ramírez Torres', 'kevin.ramirez23@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000023', '3000000023', (SELECT id_rol FROM rol WHERE nombre_rol='tecnico'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Wilson', 'García Moreno', 'wilson.garcia24@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000024', '3000000024', (SELECT id_rol FROM rol WHERE nombre_rol='tecnico'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Esteban', 'López Rojas', 'esteban.lopez25@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000025', '3000000025', (SELECT id_rol FROM rol WHERE nombre_rol='tecnico'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Andrés', 'Molina Pérez', 'andres.molina26@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000026', '3000000026', (SELECT id_rol FROM rol WHERE nombre_rol='tecnico'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Jorge', 'Salazar Díaz', 'jorge.salazar27@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000027', '3000000027', (SELECT id_rol FROM rol WHERE nombre_rol='tecnico'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Mateo', 'Cruz Herrera', 'mateo.cruz28@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000028', '3000000028', (SELECT id_rol FROM rol WHERE nombre_rol='tecnico'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),

-- Administración
('Sandra', 'Beltrán Ríos', 'sandra.beltran29@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000029', '3000000029', (SELECT id_rol FROM rol WHERE nombre_rol='administrador'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE),
('Ricardo', 'Vélez Castro', 'ricardo.velez30@soy.sena.edu.co', crypt('AsisDemo2026*', gen_salt('bf', 12)), '1000000030', '3000000030', (SELECT id_rol FROM rol WHERE nombre_rol='administrador_mesa_ayuda'), (SELECT id_tipo_id FROM tipo_identificacion WHERE iniciales='CC'), TRUE);

-- ==========================================================
-- 4. AMBIENTES: 12 POR PISO, DESDE 101 HASTA 612
-- ==========================================================

INSERT INTO ambientes
(id_ambiente, nombre_a, ubicacion, capacidad_equipos, estado, descripcion, id_cuentadante)
SELECT
    (piso * 100 + numero) AS id_ambiente,
    'Ambiente ' || (piso * 100 + numero) AS nombre_a,
    'Piso ' || piso || ' - Centro de formación CGMLTI' AS ubicacion,
    30 AS capacidad_equipos,
    'activo' AS estado,
    'Ambiente de formación dotado con equipos tecnológicos para actividades de aprendizaje.' AS descripcion,
    (
        SELECT u.id_usuario
        FROM usuarios u
        JOIN rol r ON r.id_rol = u.id_rol
        WHERE r.nombre_rol = 'cuentadante'
        ORDER BY u.id_usuario
        OFFSET ((piso * 12 + numero - 1) % 12)
        LIMIT 1
    ) AS id_cuentadante
FROM generate_series(1, 6) AS piso
CROSS JOIN generate_series(1, 12) AS numero;

-- ==========================================================
-- 5. EQUIPOS: 30 POR AMBIENTE = 2.160 EQUIPOS
-- ==========================================================

INSERT INTO equipos
(codigo, nombre, marca, serial, descripcion, estado, id_ambiente, id_tipo)
SELECT
    'ASIS-' || a.id_ambiente || '-' || LPAD(n.numero::TEXT, 2, '0') AS codigo,
    CASE
        WHEN t.nombre_t IN ('Computador', 'Computador de Mesa') THEN 'Equipo de escritorio ' || n.numero
        WHEN t.nombre_t IN ('Portatil', 'Laptop') THEN 'Equipo portátil ' || n.numero
        WHEN t.nombre_t IN ('Televisor', 'TV') THEN 'Pantalla de apoyo ' || n.numero
        ELSE 'Accesorio tecnológico ' || n.numero
    END AS nombre,
    CASE (n.numero % 6)
        WHEN 0 THEN 'HP'
        WHEN 1 THEN 'Dell'
        WHEN 2 THEN 'Lenovo'
        WHEN 3 THEN 'Samsung'
        WHEN 4 THEN 'Acer'
        ELSE 'Asus'
    END AS marca,
    'SN-' || a.id_ambiente || '-' || LPAD(n.numero::TEXT, 4, '0') AS serial,
    'Activo tecnológico registrado para control de inventario y mantenimiento.' AS descripcion,
    CASE
        WHEN n.numero % 17 = 0 THEN 'En mantenimiento'
        WHEN n.numero % 23 = 0 THEN 'Fuera de servicio'
        ELSE 'Disponible'
    END AS estado,
    a.id_ambiente,
    t.id_tipo
FROM ambientes a
CROSS JOIN generate_series(1, 30) AS n(numero)
JOIN tipo_equipo t
  ON t.id_tipo = ((n.numero - 1) % 8) + 1;

-- ==========================================================
-- 5.1 MOBILIARIO: 1 MESA DE INSTRUCTOR + 30 SILLAS POR AMBIENTE
-- ==========================================================

INSERT INTO mobiliario (codigo, serial, descripcion, estado, id_ambiente, id_tipo_mob)
SELECT
    'MOB-' || a.id_ambiente || '-MI',
    'SM-' || a.id_ambiente || '-MI',
    'Mesa del instructor',
    'Disponible',
    a.id_ambiente,
    (SELECT id_tipo_mob FROM tipo_mobiliario WHERE nombre_tm = 'Mesa instructor')
FROM ambientes a;

INSERT INTO mobiliario (codigo, serial, descripcion, estado, id_ambiente, id_tipo_mob)
SELECT
    'MOB-' || a.id_ambiente || '-S' || LPAD(n.numero::TEXT, 2, '0'),
    'SM-' || a.id_ambiente || '-S' || LPAD(n.numero::TEXT, 2, '0'),
    'Silla de ambiente de formación',
    'Disponible',
    a.id_ambiente,
    (SELECT id_tipo_mob FROM tipo_mobiliario WHERE nombre_tm = 'Silla')
FROM ambientes a
CROSS JOIN generate_series(1, 30) AS n(numero);
-- ==========================================================
-- 6. TICKETS: 144 REGISTROS DE PRUEBA
-- Se distribuyen por los 72 ambientes (2 por ambiente).
-- ==========================================================

WITH equipos_ordenados AS (
    SELECT id_equipo,
           ROW_NUMBER() OVER (ORDER BY id_equipo) AS rn
    FROM equipos
),
tecnicos AS (
    SELECT u.id_usuario,
           ROW_NUMBER() OVER (ORDER BY u.id_usuario) AS rn
    FROM usuarios u
    JOIN rol r ON r.id_rol = u.id_rol
    WHERE r.nombre_rol = 'tecnico'
),
instructores AS (
    SELECT u.id_usuario,
           ROW_NUMBER() OVER (ORDER BY u.id_usuario) AS rn
    FROM usuarios u
    JOIN rol r ON r.id_rol = u.id_rol
    WHERE r.nombre_rol = 'instructor'
),
estados AS (
    SELECT id_estado,
           ROW_NUMBER() OVER (ORDER BY id_estado) AS rn
    FROM estados_ticket
),
motivos AS (
    SELECT id_motivo,
           ROW_NUMBER() OVER (ORDER BY id_motivo) AS rn
    FROM motivo_novedad
)
INSERT INTO tickets
(motivo, fecha_salida, fecha_retorno, atendido, id_equipo, creado_por,
 asignado_a, id_estado, id_motivo_novedad, imagen, tipo_salida,
 id_ambiente_destino, persona_prestamo, fecha_devolucion)
SELECT
    CASE (g.n % 8)
        WHEN 0 THEN 'El equipo presenta lentitud durante el inicio del sistema operativo.'
        WHEN 1 THEN 'Se reporta falla de conexión a la red del ambiente.'
        WHEN 2 THEN 'El monitor presenta inconvenientes de visualización.'
        WHEN 3 THEN 'Se solicita revisión del teclado y los periféricos.'
        WHEN 4 THEN 'El equipo requiere mantenimiento preventivo.'
        WHEN 5 THEN 'Se reporta inconveniente con el sistema operativo.'
        WHEN 6 THEN 'El equipo no enciende durante la jornada de formación.'
        ELSE 'Se solicita diagnóstico general del equipo tecnológico.'
    END,
    NOW() - (g.n || ' days')::INTERVAL,
    CASE WHEN g.n % 6 IN (2, 3, 4)
         THEN NOW() - ((g.n - 1) || ' days')::INTERVAL
         ELSE NULL
    END,
    CASE WHEN g.n % 6 IN (2, 3, 4) THEN TRUE ELSE FALSE END,
    eo.id_equipo,
    i.id_usuario,
    CASE WHEN g.n % 5 = 0 THEN NULL ELSE te.id_usuario END,
    es.id_estado,
    mo.id_motivo,
    NULL,
    CASE
        WHEN g.n % 12 = 0 THEN 'traslado'
        WHEN g.n % 10 = 0 THEN 'prestamo'
        ELSE 'daño'
    END,
    CASE WHEN g.n % 12 = 0
         THEN (SELECT id_ambiente FROM ambientes ORDER BY id_ambiente OFFSET (g.n % 72) LIMIT 1)
         ELSE NULL
    END,
    CASE WHEN g.n % 10 = 0 THEN 'Funcionario de apoyo de formación' ELSE NULL END,
    CASE WHEN g.n % 10 = 0 THEN CURRENT_DATE + (g.n % 10) ELSE NULL END
FROM generate_series(1, 144) AS g(n)
JOIN equipos_ordenados eo ON eo.rn = ((g.n - 1) * 15 + 1)
JOIN instructores i ON i.rn = ((g.n - 1) % 10) + 1
JOIN tecnicos te ON te.rn = ((g.n - 1) % 6) + 1
JOIN estados es ON es.rn = ((g.n - 1) % 7) + 1
JOIN motivos mo ON mo.rn = ((g.n - 1) % 10) + 1;

-- ==========================================================
-- 7. ASIGNACIONES DE TÉCNICOS
-- Se registra una asignación para cada ticket que tenga técnico.
-- ==========================================================

INSERT INTO asignacion_tecnico
(id_ticket, id_tecnico, asignado_por)
SELECT
    t.id_ticket,
    t.asignado_a,
    (SELECT id_usuario
     FROM usuarios
     WHERE correo_u = 'ricardo.velez30@soy.sena.edu.co')
FROM tickets t
WHERE t.asignado_a IS NOT NULL;

-- ==========================================================
-- 8. HISTORIAL DE TICKETS
-- Se registra la creación de cada ticket.
-- ==========================================================

INSERT INTO historial_tickets
(accion, observacion, fecha, estado_resultante, id_ticket, id_usuario)
SELECT
    'Creación de ticket',
    'Ticket registrado para reportar una novedad del equipo.',
    t.creado_en,
    e.nombre_e,
    t.id_ticket,
    t.creado_por
FROM tickets t
JOIN estados_ticket e ON e.id_estado = t.id_estado;

-- Segundo registro de historial para tickets que tienen técnico asignado.
INSERT INTO historial_tickets
(accion, observacion, fecha, estado_resultante, id_ticket, id_usuario)
SELECT
    'Asignación de técnico',
    'El ticket fue asignado a un técnico de mesa de ayuda.',
    t.creado_en + INTERVAL '1 hour',
    e.nombre_e,
    t.id_ticket,
    t.asignado_a
FROM tickets t
JOIN estados_ticket e ON e.id_estado = t.id_estado
WHERE t.asignado_a IS NOT NULL;

-- ==========================================================
-- 9. NOTIFICACIONES
-- Se genera una notificación de ejemplo por cada ticket.
-- ==========================================================

INSERT INTO notificaciones
(canal, mensaje, enviada, fecha_envio, id_ticket, notificado_para, notificado_por)
SELECT
    CASE WHEN t.id_ticket % 2 = 0 THEN 'correo' ELSE 'sms' END,
    'ASIS: se ha registrado una actualización en el ticket #' || t.id_ticket || '.',
    CASE WHEN t.id_ticket % 4 = 0 THEN FALSE ELSE TRUE END,
    t.creado_en + INTERVAL '5 minutes',
    t.id_ticket,
    t.creado_por,
    (SELECT id_usuario
     FROM usuarios
     WHERE correo_u = 'ricardo.velez30@soy.sena.edu.co')
FROM tickets t;

COMMIT;

-- ==========================================================
-- 10. CONSULTAS PARA VERIFICAR LA CARGA
-- ==========================================================

--SELECT 'Tipos de identificación' AS tabla, COUNT(*) AS registros FROM tipo_identificacion
--UNION ALL SELECT 'Roles', COUNT(*) FROM rol
--UNION ALL SELECT 'Usuarios', COUNT(*) FROM usuarios
--UNION ALL SELECT 'Ambientes', COUNT(*) FROM ambientes
--UNION ALL SELECT 'Tipos de equipo', COUNT(*) FROM tipo_equipo
--UNION ALL SELECT 'Equipos', COUNT(*) FROM equipos
--UNION ALL SELECT 'Estados de ticket', COUNT(*) FROM estados_ticket
--UNION ALL SELECT 'Motivos de novedad', COUNT(*) FROM motivo_novedad
--UNION ALL SELECT 'Tickets', COUNT(*) FROM tickets
--UNION ALL SELECT 'Asignaciones', COUNT(*) FROM asignacion_tecnico
--UNION ALL SELECT 'Historial', COUNT(*) FROM historial_tickets
--UNION ALL SELECT 'Notificaciones', COUNT(*) FROM notificaciones
--ORDER BY tabla;

-- Distribución de ambientes por piso
--SELECT FLOOR(id_ambiente / 100) AS piso, COUNT(*) AS cantidad_ambientes
--FROM ambientes
--GROUP BY FLOOR(id_ambiente / 100)
--ORDER BY piso;

-- Cantidad de equipos por ambiente
--SELECT id_ambiente, COUNT(*) AS cantidad_equipos
--FROM equipos
--GROUP BY id_ambiente
--ORDER BY id_ambiente;


--La contraseña de prueba de los usuarios es AsisDemo2026*.