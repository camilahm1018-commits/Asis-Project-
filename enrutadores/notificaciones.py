from fastapi import APIRouter, HTTPException
from sqlmodel import select

from Modelos.notificaciones import Notificacion,NotificacionCrear,NotificacionEditar

from conexion_db import Sesion_dependencia

asis = APIRouter(
    prefix="/notificaciones",
    tags=["notificaciones"]
)

@asis.get(
    "/notificaciones",
    response_model=list[Notificacion]
)
async def listar_notificaciones(
    sesion: Sesion_dependencia
):

    notificaciones = sesion.exec(
        select(Notificacion)
    ).all()

    return notificaciones


@asis.get(
    "/notificaciones/{id}",
    response_model=Notificacion
)
async def obtener_notificacion(
    id: int,
    sesion: Sesion_dependencia
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


@asis.post(
    "/notificaciones",
    response_model=Notificacion
)
async def crear_notificacion(
    datos: NotificacionCrear,
    sesion: Sesion_dependencia
):

    nueva_notificacion = Notificacion.model_validate(
        datos.model_dump()
    )

    sesion.add(nueva_notificacion)
    sesion.commit()
    sesion.refresh(nueva_notificacion)

    return nueva_notificacion


@asis.put(
    "/notificaciones/{id}",
    response_model=Notificacion
)
async def editar_notificacion(
    id: int,
    datos: NotificacionEditar,
    sesion: Sesion_dependencia
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


@asis.delete(
    "/notificaciones/{id}",
    response_model=Notificacion
)
async def eliminar_notificacion(
    id: int,
    sesion: Sesion_dependencia
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