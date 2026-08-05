from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from conexion_db import Sesion_dependencia
from Modelos.motivo_no_reparacion import MotivoNoReparacion,MotivoCrear,MotivoEditar


asis = APIRouter(
    prefix="/motivos-no-reparacion",
    tags=["Motivos no reparación"]
)


@asis.get("/", response_model=list[MotivoNoReparacion])
async def listar_motivos(sesion: Sesion_dependencia):

    motivos = sesion.exec(select(MotivoNoReparacion)).all()

    return motivos


@asis.get("/{id}", response_model=MotivoNoReparacion)
async def obtener_motivo(
    id: int,
    sesion: Sesion_dependencia
):

    motivo = sesion.get(MotivoNoReparacion, id)

    if not motivo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Motivo no encontrado"
        )

    return motivo


@asis.post("/", response_model=MotivoNoReparacion)
async def crear_motivo(
    datos: MotivoCrear,
    sesion: Sesion_dependencia
):

    nuevo_motivo = MotivoNoReparacion.model_validate(datos)

    sesion.add(nuevo_motivo)
    sesion.commit()
    sesion.refresh(nuevo_motivo)

    return nuevo_motivo


@asis.patch("/{id}", response_model=MotivoNoReparacion)
async def editar_motivo(
    id: int,
    datos: MotivoEditar,
    sesion: Sesion_dependencia
):

    motivo = sesion.get(MotivoNoReparacion, id)

    if not motivo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Motivo no encontrado"
        )

    motivo_dict = datos.model_dump(exclude_unset=True)
    motivo.sqlmodel_update(motivo_dict)

    sesion.add(motivo)
    sesion.commit()
    sesion.refresh(motivo)

    return motivo


@asis.delete("/{id}", response_model=MotivoNoReparacion)
async def eliminar_motivo(
    id: int,
    sesion: Sesion_dependencia
):

    motivo = sesion.get(MotivoNoReparacion, id)

    if not motivo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Motivo no encontrado"
        )

    motivo_eliminado = MotivoNoReparacion.model_validate(motivo)

    sesion.delete(motivo)
    sesion.commit()

    return motivo_eliminado