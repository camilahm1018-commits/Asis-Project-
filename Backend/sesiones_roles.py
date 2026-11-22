from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlmodel import Session

from conexion_db import (
    motor_admin,
    motor_instructor,
    motor_tecnico,
    motor_mesa,
    motor_cuentadante
)

from seguridad import verificar_token


# ==========================================
# RELACIÓN ENTRE ROLES Y CONEXIONES
# ==========================================

MOTORES_POR_ROL = {
    "administrador": motor_admin,
    "instructor": motor_instructor,
    "tecnico": motor_tecnico,
    "administrador_mesa_ayuda": motor_mesa,
    "cuentadante": motor_cuentadante
}


# ==========================================
# SELECCIONAR SESIÓN SEGÚN EL ROL
# ==========================================

def obtener_sesion_por_rol(
    usuario_actual: dict = Depends(verificar_token)
):

    rol = usuario_actual["rol"]

    motor = MOTORES_POR_ROL.get(rol)

    if motor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no tiene un rol autorizado"
        )

    with Session(motor) as sesion:
        yield sesion


# ==========================================
# DEPENDENCIA PARA LOS ENRUTADORES
# ==========================================

Sesion_por_rol = Annotated[
    Session,
    Depends(obtener_sesion_por_rol)
]