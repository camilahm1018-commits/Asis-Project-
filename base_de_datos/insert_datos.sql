-- ==========================================
-- BASE DE DATOS ASIS
-- Sistema de Gestión de Tickets - CGMLTI
-- Versión actualizada con todos los cambios
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
 
    CONSTRAINT restriccion_correo
    CHECK(correo_u ~* '^[A-Za-z0-9._%+-]+@sena\.edu\.co$'),
 
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
-- TABLA: tickets
-- ==========================================
CREATE TABLE tickets(
    id_ticket SERIAL PRIMARY KEY,
    motivo TEXT NOT NULL,
    fecha_salida TIMESTAMP NOT NULL,
    fecha_retorno TIMESTAMP,
    creado_en TIMESTAMP DEFAULT NOW(),
    atendido BOOLEAN DEFAULT FALSE,
    id_equipo INT NOT NULL,
    creado_por INT NOT NULL,
    asignado_a INT,
    id_estado INT NOT NULL,
    id_motivo_novedad INT,
 
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
    REFERENCES motivo_novedad(id_motivo)
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
-- DATOS
-- ==========================================

-- Tipos de identificación
INSERT INTO tipo_identificacion (iniciales, nombre_tipo) VALUES
('CC', 'Cédula de Ciudadanía'),
('CE', 'Cédula de Extranjería'),
('TI', 'Tarjeta de Identidad'),
('RC', 'Registro Civil'),
('PAS', 'Pasaporte'),
('NIT', 'Número de Identificación Tributaria'),
('PEP', 'Permiso Especial de Permanencia'),
('PPT', 'Permiso por Protección Temporal');

-- Roles
INSERT INTO rol(nombre_rol) VALUES
('instructor'),
('tecnico'),
('administrador'),
('cuentadante'),
('administrador_mesa_ayuda');

-- Estados de ticket
INSERT INTO estados_ticket(nombre_e, color) VALUES
('Pendiente',            'rojo'),
('En reparacion',        'naranja'),
('Reparado',             'amarillo'),
('Entregado en ambiente','verde'),
('Dado de baja',         'negro'),
('Inactivar ticket',     'morado'),
('Trasladado',           'azul');

-- Tipos de equipo
INSERT INTO tipo_equipo(nombre_t) VALUES
('Computador'),
('Portatil'),
('Televisor'),
('Cargador'),
('All In One'),
('Computador de Mesa'),
('Mac'),
('Laptop'),
('TV');

-- Motivos de novedad
INSERT INTO motivo_novedad(nombre_novedad) VALUES
('Falta de repuesto'),
('Daño irreparable'),
('Equipo obsoleto'),
('Sin presupuesto'),
('En espera de proveedor'),
('Otro'),
('Daño por humedad'),
('Daño por sobrecarga eléctrica'),
('Repuesto descontinuado'),
('Costo de reparación superior al valor del equipo'),
('Garantía vencida'),
('Daño en la placa base'),
('Daño físico irreversible'),
('Manipulación no autorizada'),
('Equipo fuera de soporte del fabricante'),
('No se encontró la falla reportada'),
('Accesorios incompatibles'),
('Pendiente de aprobación para reparación'),
('Equipo dado de baja por inventario'),
('No cumple con los requisitos para reparación');

-- USUARIOS (Contraseñas hasheadas con bcrypt para '12345')
INSERT INTO usuarios(nombre_u, apellidos_u, correo_u, contrasena_u, id_tipo_identificacion, numero_documento, telefono_u, id_rol)
VALUES
-- Cuentadante inicial (id_usuario = 1)
('Janer','Cillopillo','janer.cillopillo@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'123456789','3000000000',4),

-- Instructores
('Carlos','Ramirez','carlos.ramirez@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000001','3001000001',1),
('Laura','Martinez','laura.martinez@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000002','3001000002',1),
('Andres','Gomez','andres.gomez@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000003','3001000003',1),
('Paula','Rojas','paula.rojas@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000004','3001000004',1),
('Miguel','Torres','miguel.torres@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000005','3001000005',1),

-- Tecnicos
('Daniel','Castro','daniel.castro@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000006','3001000006',2),
('Camila','Lopez','camila.lopez@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000007','3001000007',2),
('Felipe','Herrera','felipe.herrera@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000008','3001000008',2),
('Natalia','Vargas','natalia.vargas@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000009','3001000009',2),
('Kevin','Suarez','kevin.suarez@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000010','3001000010',2),

-- Administradores
('Jhon','Perez','jhon.perez@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000011','3001000011',3),
('Diana','Morales','diana.morales@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000012','3001000012',3),
('Sergio','Garcia','sergio.garcia@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000013','3001000013',3),

-- Cuentadantes
('Luisa','Fernandez','luisa.fernandez@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000014','3001000014',4),
('Oscar','Ruiz','oscar.ruiz@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000015','3001000015',4),
('Tatiana','Diaz','tatiana.diaz@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000016','3001000016',4),
('Cristian','Mendoza','cristian.mendoza@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000017','3001000017',4),

-- Administradores mesa de ayuda
('Valentina','Ortega','valentina.ortega@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000018','3001000018',5),
('Julian','Silva','julian.silva@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000019','3001000019',5),
('Melissa','Cortes','melissa.cortes@sena.edu.co','$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',1,'100000020','3001000020',5);

-- AMBIENTES
INSERT INTO ambientes(id_ambiente, nombre_a, ubicacion, capacidad_equipos, estado, descripcion, id_cuentadante)
VALUES
(101,'Ambiente ADSO 101','Bloque A - Piso 1',30,'activo','Ambiente de formación para Análisis y Desarrollo de Software',15),
(102,'Ambiente ADSO 102','Bloque A - Piso 1',30,'activo','Ambiente destinado al desarrollo de aplicaciones',16),
(103,'Ambiente de Programación','Bloque A - Piso 2',30,'activo','Equipado para prácticas de programación',17),
(104,'Ambiente de Bases de Datos','Bloque A - Piso 2',25,'activo','Prácticas de PostgreSQL, MySQL y SQL Server',18),
(105,'Ambiente de Redes','Bloque B - Piso 1',24,'activo','Configuración y administración de redes',1),
(106,'Ambiente de Telecomunicaciones','Bloque B - Piso 1',20,'activo','Prácticas de telecomunicaciones',15),
(107,'Ambiente de Electrónica','Bloque B - Piso 2',20,'activo','Diagnóstico y reparación de componentes electrónicos',16),
(108,'Ambiente de Automatización Industrial','Bloque B - Piso 2',18,'activo','Procesos de automatización y control',17),
(109,'Ambiente de Robótica','Bloque B - Piso 2',18,'activo','Desarrollo de proyectos de robótica',18),
(110,'Ambiente de Mantenimiento de Equipos','Bloque C - Piso 1',20,'activo','Mantenimiento preventivo y correctivo de computadores',1),
(111,'Ambiente de Soporte Técnico','Bloque C - Piso 1',20,'activo','Atención de incidencias de hardware y software',15),
(112,'Ambiente de Desarrollo Web','Bloque C - Piso 2',30,'activo','Construcción de aplicaciones web',16),
(113,'Ambiente de Desarrollo Móvil','Bloque C - Piso 2',24,'activo','Desarrollo de aplicaciones Android e iOS',17),
(114,'Ambiente de Ciberseguridad','Bloque C - Piso 2',20,'activo','Prácticas de seguridad informática y pentesting',18),
(115,'Ambiente de Cloud Computing','Bloque D - Piso 1',20,'activo','Servicios en la nube y virtualización',1),
(116,'Ambiente de Inteligencia Artificial','Bloque D - Piso 1',20,'activo','Desarrollo de soluciones con IA',15),
(117,'Ambiente de Innovación y Emprendimiento','Bloque D - Piso 2',25,'activo','Desarrollo de proyectos de innovación',16),
(118,'Ambiente de Diseño Multimedia','Bloque D - Piso 2',22,'activo','Creación de contenido multimedia',17),
(119,'Ambiente de Mesa de Ayuda','Bloque E - Piso 1',15,'activo','Gestión de soporte y atención a usuarios',18),
(120,'Ambiente TIC','Bloque E - Piso 2',30,'activo','Tecnologías de la Información y las Comunicaciones',1);

-- EQUIPOS
INSERT INTO equipos(codigo, nombre, marca, serial, descripcion, estado, id_ambiente, id_tipo)
VALUES
('EQ-001','Computador HP ProDesk','HP','SNHP000001','Equipo para formación','Activo',101,1),
('PT-001','Portátil ThinkPad','Lenovo','SNLN000002','Portátil institucional','Activo',102,2),
('TV-001','Televisor Smart','Samsung','SNSM000003','Televisor para apoyo audiovisual','Activo',103,3),
('CG-001','Cargador Dell 90W','Dell','SNDL000004','Cargador para portátil','Activo',104,4),
('EQ-002','All In One EliteOne','HP','SNHP000005','Equipo All In One','Activo',105,5),
('EQ-003','Computador de Mesa OptiPlex','Dell','SNDL000006','Equipo de escritorio','Activo',106,6),
('MC-001','Mac iMac 24','Apple','SNAP000007','Equipo macOS','Activo',107,7),
('PT-002','Laptop Aspire 5','Acer','SNAC000008','Laptop institucional','Activo',108,8),
('TV-002','TV LG 55','LG','SNLG000009','Pantalla para presentaciones','Activo',109,9),
('EQ-004','Computador HP EliteDesk','HP','SNHP000010','Equipo de laboratorio','Activo',110,1),
('PT-003','Portátil Latitude','Dell','SNDL000011','Portátil institucional','Activo',111,2),
('TV-003','Televisor TCL 50','TCL','SNTC000012','Pantalla multimedia','Activo',112,3),
('CG-002','Cargador Lenovo 65W','Lenovo','SNLN000013','Cargador original','Activo',113,4),
('EQ-005','All In One IdeaCentre','Lenovo','SNLN000014','Equipo All In One','Activo',114,5),
('EQ-006','Computador de Mesa Vostro','Dell','SNDL000015','Equipo para prácticas','Activo',115,6),
('MC-002','MacBook Air','Apple','SNAP000016','Portátil macOS','Activo',116,7),
('PT-004','Laptop Pavilion','HP','SNHP000017','Laptop HP','Activo',117,8),
('TV-004','TV Samsung Crystal','Samsung','SNSM000018','Pantalla institucional','Activo',118,9),
('EQ-007','Computador Lenovo ThinkCentre','Lenovo','SNLN000019','Equipo ADSO','Activo',119,1),
('PT-005','Portátil Inspiron','Dell','SNDL000020','Portátil de apoyo','Activo',120,2);

-- TICKETS
INSERT INTO tickets(motivo, fecha_salida, fecha_retorno, atendido, id_equipo, creado_por, asignado_a, id_estado, id_motivo_novedad)
VALUES
('El computador no enciende.','2026-08-01 08:00:00','2026-08-03 15:00:00',TRUE,1,2,7,3,NULL),
('La pantalla del portátil presenta líneas verticales.','2026-08-02 09:30:00',NULL,TRUE,2,3,8,2,NULL),
('El televisor no muestra imagen.','2026-08-02 10:00:00',NULL,TRUE,3,4,9,1,NULL),
('El cargador dejó de funcionar.','2026-08-03 08:20:00','2026-08-04 11:30:00',TRUE,4,5,10,4,NULL),
('El All In One está muy lento.','2026-08-03 09:00:00',NULL,TRUE,5,6,11,2,NULL),
('No reconoce dispositivos USB.','2026-08-03 10:15:00',NULL,TRUE,6,2,7,2,NULL),
('La Mac presenta error de arranque.','2026-08-04 08:00:00',NULL,TRUE,7,3,8,1,NULL),
('La batería de la laptop no carga.','2026-08-04 09:10:00',NULL,TRUE,8,4,9,2,NULL),
('El TV no reproduce sonido.','2026-08-04 10:00:00','2026-08-05 12:30:00',TRUE,9,5,10,4,NULL),
('El computador se reinicia constantemente.','2026-08-05 07:50:00',NULL,TRUE,10,6,11,1,NULL),
('El teclado del portátil no responde.','2026-08-05 08:40:00',NULL,TRUE,11,2,7,2,NULL),
('El televisor tiene la pantalla quebrada.','2026-08-05 09:00:00',NULL,TRUE,12,3,8,5,2),
('El cargador presenta falso contacto.','2026-08-05 10:20:00',NULL,TRUE,13,4,9,2,NULL),
('El All In One no inicia Windows.','2026-08-06 08:00:00',NULL,FALSE,14,5,10,1,NULL),
('El computador de mesa presenta sobrecalentamiento.','2026-08-06 09:30:00',NULL,FALSE,15,6,11,2,NULL),
('La Mac tiene el disco dañado.','2026-08-06 10:00:00',NULL,FALSE,16,2,7,5,3),
('La laptop presenta daños por líquido.','2026-08-06 11:15:00',NULL,FALSE,17,3,8,5,2),
('El TV no enciende después de un apagón.','2026-08-07 08:00:00',NULL,FALSE,18,4,9,1,NULL),
('El computador Lenovo no detecta la red.','2026-08-07 09:20:00',NULL,FALSE,19,5,10,2,NULL),
('El portátil Dell tiene el ventilador averiado.','2026-08-07 10:10:00',NULL,FALSE,20,6,11,1,NULL);

-- ASIGNACION TECNICO
INSERT INTO asignacion_tecnico(fecha_asignacion, id_ticket, id_tecnico, asignado_por)
VALUES
('2026-08-01 08:15:00',1,7,19),
('2026-08-02 09:45:00',2,8,19),
('2026-08-02 10:15:00',3,9,20),
('2026-08-03 08:35:00',4,10,20),
('2026-08-03 09:20:00',5,11,21),
('2026-08-03 10:30:00',6,7,19),
('2026-08-04 08:20:00',7,8,20),
('2026-08-04 09:30:00',8,9,21),
('2026-08-04 10:20:00',9,10,19),
('2026-08-05 08:05:00',10,11,20),
('2026-08-05 08:55:00',11,7,21),
('2026-08-05 09:20:00',12,8,19),
('2026-08-05 10:35:00',13,9,20),
('2026-08-06 08:15:00',14,10,21),
('2026-08-06 09:45:00',15,11,19),
('2026-08-06 10:20:00',16,7,20),
('2026-08-06 11:30:00',17,8,21),
('2026-08-07 08:15:00',18,9,19),
('2026-08-07 09:35:00',19,10,20),
('2026-08-07 10:25:00',20,11,21);

-- NOTIFICACIONES
INSERT INTO notificaciones(canal, mensaje, enviada, fecha_envio, id_ticket, notificado_para, notificado_por)
VALUES
('Correo','Se le ha asignado el Ticket #1 para realizar el diagnóstico del equipo.',TRUE,'2026-08-01 08:20:00',1,7,19),
('Plataforma','El equipo del Ticket #2 fue recibido por el área de soporte.',TRUE,'2026-08-02 10:00:00',2,8,19),
('SMS','El equipo del Ticket #3 salió del ambiente para mantenimiento.',TRUE,'2026-08-02 10:15:00',3,2,19),
('Correo','El Ticket #4 fue asignado para revisión técnica.',TRUE,'2026-08-03 08:40:00',4,10,20),
('Plataforma','El equipo del Ticket #5 ingresó al laboratorio.',TRUE,'2026-08-03 09:30:00',5,11,20),
('SMS','El equipo del Ticket #6 fue retirado para reparación.',TRUE,'2026-08-03 10:40:00',6,15,20),
('Correo','Se inició el diagnóstico del Ticket #7.',TRUE,'2026-08-04 08:30:00',7,8,21),
('Plataforma','El Ticket #8 continúa en proceso de reparación.',TRUE,'2026-08-04 09:40:00',8,9,21),
('SMS','El equipo del Ticket #9 fue devuelto al ambiente.',TRUE,'2026-08-05 12:40:00',9,18,19),
('Correo','El Ticket #10 fue asignado al técnico responsable.',TRUE,'2026-08-05 08:15:00',10,11,20),
('Plataforma','El equipo del Ticket #11 está en diagnóstico.',TRUE,'2026-08-05 09:05:00',11,7,21),
('SMS','El equipo del Ticket #12 no pudo ser reparado.',TRUE,'2026-08-05 11:00:00',12,16,19),
('Correo','El Ticket #13 fue recibido por mantenimiento.',TRUE,'2026-08-05 10:45:00',13,9,20),
('Plataforma','El Ticket #14 está pendiente de revisión.',FALSE,'2026-08-06 08:20:00',14,10,21),
('Correo','El Ticket #15 está en espera de diagnóstico.',FALSE,'2026-08-06 09:50:00',15,11,19),
('SMS','El equipo del Ticket #16 fue dado de baja.',FALSE,'2026-08-06 11:10:00',16,15,20),
('Plataforma','El Ticket #17 continúa pendiente de atención.',FALSE,'2026-08-06 11:35:00',17,8,21),
('Correo','El Ticket #18 fue asignado al técnico encargado.',FALSE,'2026-08-07 08:20:00',18,9,19),
('SMS','Se confirma la devolución del equipo del Ticket #19.',FALSE,'2026-08-07 09:45:00',19,17,20),
('Plataforma','El Ticket #20 fue registrado y está pendiente.',FALSE,'2026-08-07 10:30:00',20,11,21);

-- HISTORIAL TICKETS
INSERT INTO historial_tickets(accion, observacion, fecha, estado_resultante, id_ticket, id_usuario)
VALUES
('Registro de ticket','El instructor registró la novedad del equipo.','2026-08-01 08:00:00','Pendiente',1,2),
('Asignación de técnico','El ticket fue asignado al técnico Daniel Castro.','2026-08-01 08:15:00','En reparacion',1,7),
('Traslado a mantenimiento','El equipo fue retirado del ambiente para diagnóstico.','2026-08-02 10:15:00','En reparacion',3,9),
('Equipo reparado','Se reemplazó el cargador y se realizaron pruebas.','2026-08-04 11:20:00','Reparado',4,10),
('Ingreso a laboratorio','El equipo ingresó al laboratorio de mantenimiento.','2026-08-03 09:20:00','En reparacion',5,11),
('Diagnóstico realizado','Se detectó una falla en la memoria RAM.','2026-08-03 11:00:00','En reparacion',6,7),
('Registro de ticket','Se reportó falla en el sistema operativo.','2026-08-04 08:00:00','Pendiente',7,3),
('Cambio de batería','Se reemplazó la batería defectuosa del portátil.','2026-08-04 12:30:00','Reparado',8,9),
('Equipo entregado','El equipo fue devuelto y recibido por el cuentadante.','2026-08-05 12:40:00','Entregado en ambiente',9,18),
('Pendiente de revisión','El equipo quedó en espera de diagnóstico técnico.','2026-08-05 08:30:00','Pendiente',10,11),
('Diagnóstico realizado','Se detectó daño en el teclado del portátil.','2026-08-05 09:30:00','En reparacion',11,7),
('Dado de baja','La pantalla estaba completamente destruida.','2026-08-05 11:10:00','Dado de baja',12,8),
('Recepción en mantenimiento','El cargador fue recibido para revisión.','2026-08-05 10:45:00','En reparacion',13,9),
('Registro de ticket','Se registró el daño reportado por el instructor.','2026-08-06 08:10:00','Pendiente',14,5),
('Diagnóstico de hardware','Sobrecalentamiento por acumulación de polvo.','2026-08-06 10:00:00','En reparacion',15,11),
('Dado de baja','El equipo fue declarado obsoleto.','2026-08-06 11:15:00','Dado de baja',16,7),
('Registro de ticket','Se reportó daño ocasionado por líquido.','2026-08-06 11:20:00','Pendiente',17,3),
('Asignación de técnico','El ticket fue asignado para iniciar diagnóstico.','2026-08-07 08:20:00','En reparacion',18,9),
('Diagnóstico de red','Se solucionó el problema de conectividad.','2026-08-07 09:50:00','Reparado',19,10),
('Cambio de ventilador','Se reemplazó el ventilador y el equipo quedó operativo.','2026-08-07 11:15:00','Entregado en ambiente',20,11);