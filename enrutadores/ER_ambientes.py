from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from conexion_db import Sesion_dependencia
from modelos.ambientes import (
    Ambiente,
    AmbienteCrear,
    AmbienteEditar,
    AmbienteLeer
)

asis = APIRouter(
    prefix="/ambientes",
    tags=["Ambientes"]
)


@asis.get("/", response_model=list[AmbienteLeer])
async def listar_ambientes(sesion: Sesion_dependencia):

    lista_ambientes = sesion.exec(select(Ambiente)).all()

    return lista_ambientes


@asis.get("/{id_ambiente}", response_model=AmbienteLeer)
async def obtener_ambiente(
    id_ambiente: int,
    sesion: Sesion_dependencia
):

    ambiente = sesion.get(Ambiente, id_ambiente)

    if not ambiente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ambiente no encontrado"
        )

    return ambiente


@asis.post("/", response_model=AmbienteLeer)
async def crear_ambiente(
    datos_ambiente: AmbienteCrear,
    sesion: Sesion_dependencia
):

    nuevo_ambiente = Ambiente.model_validate(datos_ambiente)

    sesion.add(nuevo_ambiente)
    sesion.commit()
    sesion.refresh(nuevo_ambiente)

    return nuevo_ambiente


@asis.patch("/{id_ambiente}", response_model=AmbienteLeer)
async def editar_ambiente(
    id_ambiente: int,
    datos_ambiente: AmbienteEditar,
    sesion: Sesion_dependencia
):

    ambiente = sesion.get(Ambiente, id_ambiente)

    if not ambiente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ambiente no encontrado"
        )

    ambiente_dict = datos_ambiente.model_dump(exclude_unset=True)
    ambiente.sqlmodel_update(ambiente_dict)

    sesion.add(ambiente)
    sesion.commit()
    sesion.refresh(ambiente)

    return ambiente


@asis.delete("/{id_ambiente}", response_model=AmbienteLeer)
async def eliminar_ambiente(
    id_ambiente: int,
    sesion: Sesion_dependencia
):

    ambiente = sesion.get(Ambiente, id_ambiente)

    if not ambiente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ambiente no encontrado"
        )

    ambiente_eliminado = AmbienteLeer.model_validate(ambiente)

    sesion.delete(ambiente)
    sesion.commit()

    return ambiente_eliminado