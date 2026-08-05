from fastapi import APIRouter, HTTPException
from sqlmodel import select

from modelos.tipo_equipo import (
    TipoEquipo,
    TipoEquipoCrear,
    TipoEquipoEditar
)

from conexion_db import Sesion_dependencia

asis = APIRouter(
    prefix="/tipo_equipo",
    tags=["Tipo de equipo"]
)


@asis.get(
    "/tipos-equipo",
    response_model=list[TipoEquipo]
)
async def listar_tipos_equipo(
    sesion: Sesion_dependencia
):
    return sesion.exec(
        select(TipoEquipo)
    ).all()


@asis.get(
    "/tipos-equipo/{id}",
    response_model=TipoEquipo
)
async def obtener_tipo_equipo(
    id: int,
    sesion: Sesion_dependencia
):
    tipo_bd = sesion.get(
        TipoEquipo,
        id
    )

    if not tipo_bd:
        raise HTTPException(
            status_code=404,
            detail="Tipo no encontrado"
        )

    return tipo_bd


@asis.post(
    "/tipos-equipo",
    response_model=TipoEquipo
)
async def crear_tipo_equipo(
    datos: TipoEquipoCrear,
    sesion: Sesion_dependencia
):

    nuevo = TipoEquipo.model_validate(
        datos.model_dump()
    )

    sesion.add(nuevo)
    sesion.commit()
    sesion.refresh(nuevo)

    return nuevo


@asis.put(
    "/tipos-equipo/{id}",
    response_model=TipoEquipo
)
async def editar_tipo_equipo(
    id: int,
    datos: TipoEquipoEditar,
    sesion: Sesion_dependencia
):

    tipo_bd = sesion.get(
        TipoEquipo,
        id
    )

    if not tipo_bd:
        raise HTTPException(
            status_code=404,
            detail="Tipo no encontrado"
        )

    tipo_bd.sqlmodel_update(
        datos.model_dump(
            exclude_unset=True
        )
    )

    sesion.add(tipo_bd)
    sesion.commit()
    sesion.refresh(tipo_bd)

    return tipo_bd


@asis.delete(
    "/tipos-equipo/{id}",
    response_model=TipoEquipo
)
async def eliminar_tipo_equipo(
    id: int,
    sesion: Sesion_dependencia
):

    tipo_bd = sesion.get(
        TipoEquipo,
        id
    )

    if not tipo_bd:
        raise HTTPException(
            status_code=404,
            detail="Tipo no encontrado"
        )

    sesion.delete(tipo_bd)
    sesion.commit()

    return tipo_bd