from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.modelos.motivo_no_reparacion import (
    MotivoNoReparacion,
    MotivoCrear,
    MotivoEditar
)

from app.conexion_bd import sesion_dependencia

ruta_tipo_motivo = APIRouter()


@ruta_tipo_motivo.get(
    "/motivos-no-reparacion",
    response_model=list[MotivoNoReparacion]
)
async def listar_motivos(
    sesion: sesion_dependencia
):

    motivos = sesion.exec(
        select(MotivoNoReparacion)
    ).all()

    return motivos


@ruta_tipo_motivo.get(
    "/motivos-no-reparacion/{id}",
    response_model=MotivoNoReparacion
)
async def obtener_motivo(
    id: int,
    sesion: sesion_dependencia
):

    motivo_bd = sesion.get(
        MotivoNoReparacion,
        id
    )

    if not motivo_bd:
        raise HTTPException(
            status_code=404,
            detail="Motivo no encontrado"
        )

    return motivo_bd


@ruta_tipo_motivo.post(
    "/motivos-no-reparacion",
    response_model=MotivoNoReparacion
)
async def crear_motivo(
    datos: MotivoCrear,
    sesion: sesion_dependencia
):

    nuevo_motivo = MotivoNoReparacion.model_validate(
        datos.model_dump()
    )

    sesion.add(nuevo_motivo)
    sesion.commit()
    sesion.refresh(nuevo_motivo)

    return nuevo_motivo


@ruta_tipo_motivo.put(
    "/motivos-no-reparacion/{id}",
    response_model=MotivoNoReparacion
)
async def editar_motivo(
    id: int,
    datos: MotivoEditar,
    sesion: sesion_dependencia
):

    motivo_bd = sesion.get(
        MotivoNoReparacion,
        id
    )

    if not motivo_bd:
        raise HTTPException(
            status_code=404,
            detail="Motivo no encontrado"
        )

    motivo_dict = datos.model_dump(
        exclude_unset=True
    )

    motivo_bd.sqlmodel_update(
        motivo_dict
    )

    sesion.add(motivo_bd)
    sesion.commit()
    sesion.refresh(motivo_bd)

    return motivo_bd


@ruta_tipo_motivo.delete(
    "/motivos-no-reparacion/{id}",
    response_model=MotivoNoReparacion
)
async def eliminar_motivo(
    id: int,
    sesion: sesion_dependencia
):

    motivo_bd = sesion.get(
        MotivoNoReparacion,
        id
    )

    if not motivo_bd:
        raise HTTPException(
            status_code=404,
            detail="Motivo no encontrado"
        )

    sesion.delete(motivo_bd)
    sesion.commit()

    return motivo_bd