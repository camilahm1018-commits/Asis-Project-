from fastapi import APIRouter, HTTPException
from sqlmodel import select

from modelos.notificaciones import (
    Notificacion,
    NotificacionCrear,
    NotificacionEditar
)

from conexion_db import sesion_dependencia

ruta_notificaciones = APIRouter()


@ruta_notificaciones.get(
    "/notificaciones",
    response_model=list[Notificacion]
)
async def listar_notificaciones(
    sesion: sesion_dependencia
):

    notificaciones = sesion.exec(
        select(Notificacion)
    ).all()

    return notificaciones


@ruta_notificaciones.get(
    "/notificaciones/{id}",
    response_model=Notificacion
)
async def obtener_notificacion(
    id: int,
    sesion: sesion_dependencia
):

    notificacion_bd = sesion.get(
        Notificacion,
        id
    )

    if not notificacion_bd:
        raise HTTPException(
            status_code=404,
            detail="Notificación no encontrada"
        )

    return notificacion_bd


@ruta_notificaciones.post(
    "/notificaciones",
    response_model=Notificacion
)
async def crear_notificacion(
    datos: NotificacionCrear,
    sesion: sesion_dependencia
):

    nueva_notificacion = Notificacion.model_validate(
        datos.model_dump()
    )

    sesion.add(nueva_notificacion)
    sesion.commit()
    sesion.refresh(nueva_notificacion)

    return nueva_notificacion


@ruta_notificaciones.put(
    "/notificaciones/{id}",
    response_model=Notificacion
)
async def editar_notificacion(
    id: int,
    datos: NotificacionEditar,
    sesion: sesion_dependencia
):

    notificacion_bd = sesion.get(
        Notificacion,
        id
    )

    if not notificacion_bd:
        raise HTTPException(
            status_code=404,
            detail="Notificación no encontrada"
        )

    notificacion_dict = datos.model_dump(
        exclude_unset=True
    )

    notificacion_bd.sqlmodel_update(
        notificacion_dict
    )

    sesion.add(notificacion_bd)
    sesion.commit()
    sesion.refresh(notificacion_bd)

    return notificacion_bd


@ruta_notificaciones.delete(
    "/notificaciones/{id}",
    response_model=Notificacion
)
async def eliminar_notificacion(
    id: int,
    sesion: sesion_dependencia
):

    notificacion_bd = sesion.get(
        Notificacion,
        id
    )

    if not notificacion_bd:
        raise HTTPException(
            status_code=404,
            detail="Notificación no encontrada"
        )

    sesion.delete(notificacion_bd)
    sesion.commit()

    return notificacion_bd