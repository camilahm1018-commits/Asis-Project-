from fastapi import HTTPException, status
from sqlmodel import Session, select

from Modelos.Usuarios import Usuario
from Modelos.roles import Rol


def validar_tecnico_activo(
    sesion: Session,
    id_tecnico: int
):
    # Consultar solamente las columnas necesarias.
    resultado = sesion.exec(
        select(
            Usuario.activo,
            Rol.nombre_rol
        )
        .join(
            Rol,
            Usuario.id_rol == Rol.id_rol
        )
        .where(Usuario.id_usuario == id_tecnico)
    ).first()

    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El técnico no existe"
        )

    activo, nombre_rol = resultado

    if not activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está inactivo"
        )

    if nombre_rol.strip().lower() != "tecnico":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario seleccionado no es un técnico"
        )