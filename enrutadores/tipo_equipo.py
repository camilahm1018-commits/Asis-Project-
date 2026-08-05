from fastapi import APIRouter, HTTPException
from sqlmodel import select

from modelos.tipo_equipo import (
    TipoEquipo,
    TipoEquipoCrear,
    TipoEquipoEditar
)

from conexion_db import sesion_dependencia

ruta_tipo_equipo = APIRouter()


@ruta_tipo_equipo.get(
    "/tipos-equipo",
    response_model=list[TipoEquipo]
)
async def listar_tipos_equipo(
    sesion: sesion_dependencia
):
    return sesion.exec(
        select(TipoEquipo)
    ).all()


@ruta_tipo_equipo.get(
    "/tipos-equipo/{id}",
    response_model=TipoEquipo
)
async def obtener_tipo_equipo(
    id: int,
    sesion: sesion_dependencia
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


@ruta_tipo_equipo.post(
    "/tipos-equipo",
    response_model=TipoEquipo
)
async def crear_tipo_equipo(
    datos: TipoEquipoCrear,
    sesion: sesion_dependencia
):

    nuevo = TipoEquipo.model_validate(
        datos.model_dump()
    )

    sesion.add(nuevo)
    sesion.commit()
    sesion.refresh(nuevo)

    return nuevo


@ruta_tipo_equipo.put(
    "/tipos-equipo/{id}",
    response_model=TipoEquipo
)
async def editar_tipo_equipo(
    id: int,
    datos: TipoEquipoEditar,
    sesion: sesion_dependencia
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


@ruta_tipo_equipo.delete(
    "/tipos-equipo/{id}",
    response_model=TipoEquipo
)
async def eliminar_tipo_equipo(
    id: int,
    sesion: sesion_dependencia
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