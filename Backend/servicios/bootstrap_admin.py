"""Crea una sola vez el admin inicial. No sobrescribe contraseñas existentes."""
import os
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from conexion_db import motor_admin
from seguridad import encriptar_contrasena


def crear_admin_inicial():
    correo = os.environ.get("ASIS_INITIAL_ADMIN_EMAIL", "admin@sena.edu.co")
    clave = os.environ.get("ASIS_INITIAL_ADMIN_PASSWORD", "")
    with Session(motor_admin) as sesion:
        if sesion.exec(select(Usuario.id_usuario).where(Usuario.correo_u == correo)).first() is not None:
            print("ASIS: administrador inicial ya existe; no se modifica su contraseña")
            return
        if not clave:
            print("ASIS: no se creó el administrador; configura ASIS_INITIAL_ADMIN_PASSWORD en .env")
            return
        if len(clave) < 12:
            raise RuntimeError("ASIS_INITIAL_ADMIN_PASSWORD debe tener al menos 12 caracteres")
        rol = sesion.exec(select(Rol).where(Rol.nombre_rol == "administrador")).first()
        if rol is None:
            raise RuntimeError("No existe el rol administrador; revisa SQL de inicialización")
        nuevo = Usuario(
            nombre_u=os.environ.get("ASIS_INITIAL_ADMIN_NAME", "Admin"),
            apellidos_u="ASIS", correo_u=correo,
            contrasena_u=encriptar_contrasena(clave),
            numero_documento=os.environ.get("ASIS_INITIAL_ADMIN_DOCUMENT", "ASIS-ADMIN-0001"),
            telefono_u=None, id_rol=rol.id_rol, id_tipo_identificacion=1,
            activo=True,
        )
        sesion.add(nuevo)
        try:
            sesion.commit()
        except IntegrityError as exc:
            sesion.rollback()
            raise RuntimeError("No se pudo crear admin inicial: correo/documento duplicado") from exc
        print("ASIS: administrador inicial creado correctamente")
