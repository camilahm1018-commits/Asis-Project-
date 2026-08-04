from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from conexion_db import get_session
from modelos.ambientes import Ambiente, AmbienteCrear, AmbienteEditar, AmbienteLeer


router = APIRouter(
    prefix="/ambientes",
    tags=["Ambientes"]
)


# Crear ambiente
@router.post("/", response_model=AmbienteLeer)
def crear_ambiente(
    ambiente: AmbienteCrear,
    session: Session = Depends(get_session)
):

    nuevo_ambiente = Ambiente.model_validate(ambiente)

    session.add(nuevo_ambiente)
    session.commit()
    session.refresh(nuevo_ambiente)

    return nuevo_ambiente



# Obtener todos los ambientes
@router.get("/", response_model=list[AmbienteLeer])
def listar_ambientes(
    session: Session = Depends(get_session)
):

    ambientes = session.exec(
        select(Ambiente)
    ).all()

    return ambientes



# Obtener un ambiente por id
@router.get("/{id_ambiente}", response_model=AmbienteLeer)
def obtener_ambiente(
    id_ambiente: int,
    session: Session = Depends(get_session)
):

    ambiente = session.get(Ambiente, id_ambiente)

    if not ambiente:
        raise HTTPException(
            status_code=404,
            detail="Ambiente no encontrado"
        )

    return ambiente



# Editar ambiente
@router.put("/{id_ambiente}", response_model=AmbienteLeer)
def editar_ambiente(
    id_ambiente: int,
    datos: AmbienteEditar,
    session: Session = Depends(get_session)
):

    ambiente = session.get(Ambiente, id_ambiente)

    if not ambiente:
        raise HTTPException(
            status_code=404,
            detail="Ambiente no encontrado"
        )


    datos_actualizados = datos.model_dump()

    for campo, valor in datos_actualizados.items():
        setattr(ambiente, campo, valor)


    session.add(ambiente)
    session.commit()
    session.refresh(ambiente)

    return ambiente



# Eliminar ambiente
@router.delete("/{id_ambiente}")
def eliminar_ambiente(
    id_ambiente: int,
    session: Session = Depends(get_session)
):

    ambiente = session.get(Ambiente, id_ambiente)

    if not ambiente:
        raise HTTPException(
            status_code=404,
            detail="Ambiente no encontrado"
        )


    session.delete(ambiente)
    session.commit()

    return {
        "mensaje": "Ambiente eliminado correctamente"
    }